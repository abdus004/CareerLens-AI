// FastAPI returns `detail` as a plain string for a normal
// HTTPException(status_code=..., detail="some message"), but as an
// ARRAY of { type, loc, msg, input, url } objects for a 422 request
// validation error (a field that failed Pydantic validation before
// the route even ran). Components across the app do
// `err.response?.data?.detail || "fallback"` and render the result
// directly as `{error}` in JSX - that crashes the whole page with
// "Objects are not valid as a React child" the moment `detail` is
// ever the array form, taking the user to a blank screen instead of
// showing them what went wrong.
//
// getErrorMessage() is always safe to render directly.
export function getErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  const detail = err?.response?.data?.detail;

  if (!detail) return fallback;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null;
          const msg = item.msg || "";
          return field ? `${field}: ${msg}` : msg;
        }
        return null;
      })
      .filter(Boolean);

    return messages.length > 0 ? messages.join(" | ") : fallback;
  }

  // Any other unexpected shape (a single {msg} object, etc.) - never
  // return the raw object itself.
  if (typeof detail === "object") {
    return detail.msg || fallback;
  }

  return fallback;
}
