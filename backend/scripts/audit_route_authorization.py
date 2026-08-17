#!/usr/bin/env python3
"""
Route Authorization Guardrail
==============================

WHY THIS EXISTS
----------------
This backend's Supabase client is initialized with a service-role key
(see app/database/db.py) so it can perform admin-only Auth operations
(password change, account deletion in routes/settings.py). A
service-role key bypasses Row Level Security entirely - which means
Postgres/Supabase provides NO second layer of protection behind this
backend's own Python code. `require_self()` / the `_require_owns_*`
per-file ownership helpers (utils/security.py and the local helpers in
routes/skill_assessment.py, routes/mock_interview.py) are not "one
layer of defense" here - they are the ONLY layer. A single route that
forgets to call one of them is a full, silent authorization bypass:
anyone logged in as anyone can read or modify anyone else's data,
and nothing else in the stack will catch it.

This script is a static-analysis guardrail against exactly that
regression. It scans every FastAPI route handler in app/routes/ and
flags any endpoint that:

  (a) takes an `email` parameter directly (path or query), or
  (b) takes a Pydantic request-body model that itself has an `email`
      field (cross-checked against every model in app/models/),

and does NOT call `require_self(...)` (or a locally-defined
`_require_owns_*` ownership helper) anywhere in its body.

This is deliberately a NAME-based check, not a full data-flow/taint
analysis: it trusts that a function called `require_self` or
`_require_owns_X` actually performs a real ownership check (that's a
code-review concern, not a static-analysis one) - what it guarantees
is that SOME such call is present at all, so the exact bug class this
guardrail exists to catch - a route that reads/writes an email-owned
resource with literally zero ownership verification - cannot ship
silently.

It also prints an ADVISORY (non-blocking) section for routes that key
off an `*_id` path parameter (assessment_id, interview_id, etc.)
without an obvious ownership-helper call, since inferring "does this
ID represent a resource some user owns" purely from a parameter name
is inherently fuzzy - those need a human to confirm intent (some, like
placement drive IDs, are intentionally public).

USAGE
-----
    python3 scripts/audit_route_authorization.py

Exit code 0 = no violations found. Exit code 1 = at least one
route with an email-owned parameter has no detectable ownership
check - CI should fail the build on that exit code.

Run this from backend/. No third-party dependencies (stdlib `ast`
only), so it works with or without pytest installed, and can be
wired into CI as its own step or dropped into a pytest test (see
the tiny wrapper at the bottom of this file).

EXPLICIT ALLOWLIST
-------------------
If a route is genuinely, intentionally public despite taking an
`email` parameter (none exist in this codebase today - every email
parameter route is meant to be self-only), add its
"file.py::function_name" to ALLOWLISTED_ROUTES below with a comment
explaining why. Do not add to this list to silence a violation you
haven't actually reasoned about.
"""

import ast
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
ROUTES_DIR = BACKEND_ROOT / "app" / "routes"
MODELS_DIR = BACKEND_ROOT / "app" / "models"

HTTP_METHODS = {"get", "post", "put", "delete", "patch"}

# See "EXPLICIT ALLOWLIST" above. Every entry here must be a route
# that is genuinely, intentionally reachable without proving ownership
# of the email it receives - do not add an entry just to silence a
# violation you haven't reasoned about.
ALLOWLISTED_ROUTES: set[str] = {
    # Signup/Login are the ONLY legitimate exceptions in this codebase:
    # by definition, there is no authenticated "self" yet to check the
    # submitted email against - that's the entire point of these two
    # routes. Every other email-bearing route runs AFTER
    # get_authenticated_email() has established who is actually logged
    # in, which is what require_self() then checks the target email
    # against.
    "auth.py::signup",
    "auth.py::login",
}

# Parameter name patterns treated as "this call verifies ownership".
OWNERSHIP_CALL_NAMES = {"require_self"}


def _is_ownership_call_name(name: str) -> bool:
    return name in OWNERSHIP_CALL_NAMES or name.lstrip("_").startswith("require_owns")


def _annotation_to_str(annotation) -> str | None:
    if annotation is None:
        return None
    try:
        return ast.unparse(annotation)
    except Exception:
        return None


def find_email_bearing_models(models_dir: Path) -> set[str]:
    """
    Parses every model file and returns the set of class names that
    have a field literally named `email` (covers EmailStr and str
    alike - the type doesn't matter, only the field name).
    """
    email_models: set[str] = set()

    for path in sorted(models_dir.glob("*.py")):
        tree = ast.parse(path.read_text(), filename=str(path))
        for node in ast.walk(tree):
            if not isinstance(node, ast.ClassDef):
                continue
            for stmt in node.body:
                if (
                    isinstance(stmt, ast.AnnAssign)
                    and isinstance(stmt.target, ast.Name)
                    and stmt.target.id == "email"
                ):
                    email_models.add(node.name)
                    break

    return email_models


def function_calls_ownership_check(func: ast.AST) -> bool:
    for node in ast.walk(func):
        if not isinstance(node, ast.Call):
            continue
        callee = node.func
        if isinstance(callee, ast.Name) and _is_ownership_call_name(callee.id):
            return True
        if isinstance(callee, ast.Attribute) and _is_ownership_call_name(callee.attr):
            return True
    return False


def is_route_decorator(dec: ast.AST) -> bool:
    # Matches @router.get(...), @router.post(...), etc.
    if not isinstance(dec, ast.Call):
        return False
    func = dec.func
    return (
        isinstance(func, ast.Attribute)
        and func.attr in HTTP_METHODS
        and isinstance(func.value, ast.Name)
        and func.value.id == "router"
    )


ID_PARAM_SUFFIXES = ("_id",)


def audit_file(path: Path, email_models: set[str]):
    """Returns (violations, advisories) for one routes/*.py file."""
    violations = []
    advisories = []

    tree = ast.parse(path.read_text(), filename=str(path))

    for node in tree.body:
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        if not any(is_route_decorator(d) for d in node.decorator_list):
            continue

        route_id = f"{path.name}::{node.name}"
        if route_id in ALLOWLISTED_ROUTES:
            continue

        all_args = [
            *node.args.posonlyargs,
            *node.args.args,
            *node.args.kwonlyargs,
        ]

        has_direct_email_param = any(a.arg == "email" for a in all_args)

        email_model_params = [
            a.arg
            for a in all_args
            if (ann := _annotation_to_str(a.annotation)) in email_models
        ]

        id_params = [
            a.arg
            for a in all_args
            if a.arg.endswith(ID_PARAM_SUFFIXES) and a.arg != "email"
        ]

        needs_ownership_check = has_direct_email_param or bool(email_model_params)
        has_check = function_calls_ownership_check(node)

        if needs_ownership_check and not has_check:
            reasons = []
            if has_direct_email_param:
                reasons.append("direct `email` parameter")
            if email_model_params:
                reasons.append(
                    f"body model with an email field: {', '.join(email_model_params)}"
                )
            violations.append(
                {
                    "file": path.name,
                    "function": node.name,
                    "line": node.lineno,
                    "reason": "; ".join(reasons),
                }
            )
        elif id_params and not has_check and not needs_ownership_check:
            advisories.append(
                {
                    "file": path.name,
                    "function": node.name,
                    "line": node.lineno,
                    "id_params": ", ".join(id_params),
                }
            )

    return violations, advisories


def main() -> int:
    if not ROUTES_DIR.exists():
        print(f"Routes directory not found: {ROUTES_DIR}", file=sys.stderr)
        return 2

    email_models = find_email_bearing_models(MODELS_DIR)

    all_violations = []
    all_advisories = []

    for path in sorted(ROUTES_DIR.glob("*.py")):
        if path.name == "__init__.py":
            continue
        violations, advisories = audit_file(path, email_models)
        all_violations.extend(violations)
        all_advisories.extend(advisories)

    print("=" * 72)
    print("ROUTE AUTHORIZATION GUARDRAIL")
    print("=" * 72)
    print(f"Email-bearing request models detected: {sorted(email_models) or '(none)'}")
    print()

    if all_violations:
        print(f"\033[91mFAIL: {len(all_violations)} route(s) with an email-owned "
              f"parameter have no detectable ownership check:\033[0m")
        for v in all_violations:
            print(f"  - {v['file']}:{v['line']}  {v['function']}()")
            print(f"      reason: {v['reason']}")
    else:
        print("\033[92mPASS: every route with an email-owned parameter calls "
              "require_self() (or an equivalent ownership check).\033[0m")

    if all_advisories:
        print()
        print(f"ADVISORY (not blocking, needs human judgment) - "
              f"{len(all_advisories)} route(s) key off an ID parameter with no "
              f"obvious ownership-helper call. Confirm each is intentionally "
              f"public or already ownership-checked via a pattern this script "
              f"doesn't recognize:")
        for a in all_advisories:
            print(f"  - {a['file']}:{a['line']}  {a['function']}()  "
                  f"[{a['id_params']}]")

    print("=" * 72)

    return 1 if all_violations else 0


if __name__ == "__main__":
    sys.exit(main())


# --- Optional pytest wrapper -------------------------------------------
# If/when pytest is added to this project (see requirements.txt - it
# isn't currently a dependency), this file can also be collected
# directly as a test: `pytest scripts/audit_route_authorization.py`.
def test_no_unauthorized_email_owned_routes():
    email_models = find_email_bearing_models(MODELS_DIR)
    all_violations = []
    for path in sorted(ROUTES_DIR.glob("*.py")):
        if path.name == "__init__.py":
            continue
        violations, _ = audit_file(path, email_models)
        all_violations.extend(violations)

    assert not all_violations, (
        "Route(s) with an email-owned parameter have no detectable "
        f"ownership check: {all_violations}"
    )