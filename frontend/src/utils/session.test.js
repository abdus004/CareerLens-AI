import { beforeEach, describe, expect, it, vi } from "vitest";

const user = { email: "student@example.com", id: "student-id" };
const session = (overrides = {}) => ({
  access_token: "access-old",
  refresh_token: "refresh-old",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  ...overrides,
});

async function loadSession() {
  vi.resetModules();
  return import("./session");
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("session storage and restoration", () => {
  it("preserves the Remember Me storage selection", async () => {
    const manager = await loadSession();
    manager.saveSession(user, session(), true);
    expect(localStorage.getItem("session")).toContain("access-old");
    expect(sessionStorage.getItem("session")).toBeNull();

    manager.saveSession(user, session(), false);
    expect(localStorage.getItem("session")).toBeNull();
    expect(sessionStorage.getItem("session")).toContain("access-old");
    expect(manager.getRememberMePreference()).toBe(false);
  });

  it("restores an unexpired session without a refresh request", async () => {
    const manager = await loadSession();
    manager.saveSession(user, session(), true);
    const result = await manager.restoreSession({ request: vi.fn() });
    expect(result.status).toBe("authenticated");
    expect(result.session.access_token).toBe("access-old");
  });

  it("refreshes an expired session in its original storage", async () => {
    const manager = await loadSession();
    manager.saveSession(user, session({ expires_at: 1 }), false);
    const request = vi.fn().mockResolvedValue({
      user,
      session: session({ access_token: "access-new", refresh_token: "refresh-new", expires_at: 9999999999 }),
    });

    const result = await manager.restoreSession({ request });
    expect(result.status).toBe("authenticated");
    expect(request).toHaveBeenCalledWith("refresh-old");
    expect(manager.getCurrentSession().refresh_token).toBe("refresh-new");
    expect(sessionStorage.getItem("session")).toContain("refresh-new");
    expect(localStorage.getItem("session")).toBeNull();
  });

  it("uses one in-tab refresh for concurrent callers", async () => {
    const manager = await loadSession();
    manager.saveSession(user, session({ expires_at: 1 }), true);
    let resolveRequest;
    const request = vi.fn(() => new Promise((resolve) => { resolveRequest = resolve; }));
    const first = manager.refreshSession({ request });
    const second = manager.refreshSession({ request });
    resolveRequest({ user, session: session({ access_token: "access-new", refresh_token: "refresh-new" }) });

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("clears a definitely invalid expired session", async () => {
    const manager = await loadSession();
    manager.saveSession(user, session({ expires_at: 1 }), true);
    const error = Object.assign(new Error("expired"), { status: 401 });
    const result = await manager.restoreSession({ request: vi.fn().mockRejectedValue(error) });
    expect(result.status).toBe("expired");
    expect(manager.getCurrentSession()).toBeNull();
  });
});

describe("cross-tab and logout coordination", () => {
  it("applies a newer BroadcastChannel rotation without changing storage type", async () => {
    class FakeChannel {
      static instances = [];
      constructor() { FakeChannel.instances.push(this); }
      postMessage() {}
    }
    vi.stubGlobal("BroadcastChannel", FakeChannel);
    const manager = await loadSession();
    manager.saveSession(user, session(), false);
    const channel = FakeChannel.instances[0];
    channel.onmessage({ data: {
      type: "session_updated",
      user,
      session: session({ access_token: "access-new", refresh_token: "refresh-new" }),
      storage: "local",
      revision: Date.now() + 1000,
    } });

    expect(manager.getCurrentSession().access_token).toBe("access-new");
    expect(sessionStorage.getItem("session")).toContain("access-new");
    expect(localStorage.getItem("session")).toBeNull();
  });

  it("clears state even when backend logout is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const manager = await loadSession();
    manager.saveSession(user, session(), true);
    await manager.logoutSession();
    expect(manager.getCurrentSession()).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
