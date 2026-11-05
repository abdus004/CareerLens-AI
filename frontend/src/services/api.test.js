import AxiosMockAdapter from "axios-mock-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let api;
let sessionManager;
let mock;

const user = { email: "student@example.com" };
const makeSession = (overrides = {}) => ({
  access_token: "access-old",
  refresh_token: "refresh-old",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  ...overrides,
});

beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ user, session: makeSession({ access_token: "access-new", refresh_token: "refresh-new" }) }),
  }));
  sessionManager = await import("../utils/session");
  api = (await import("./api")).default;
  mock = new AxiosMockAdapter(api);
});

afterEach(() => {
  mock.restore();
  vi.unstubAllGlobals();
});

describe("Axios session retry", () => {
  it("refreshes once and retries an eligible expired-session request", async () => {
    sessionManager.saveSession(user, makeSession());
    mock.onGet("/dashboard").replyOnce(401, { detail: "Your session has expired." });
    mock.onGet("/dashboard").replyOnce((config) => [200, { authorization: config.headers.Authorization }]);

    const response = await api.get("/dashboard");
    expect(response.data.authorization).toBe("Bearer access-new");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mock.history.get).toHaveLength(2);
  });

  it("does not refresh excluded authentication endpoints", async () => {
    sessionManager.saveSession(user, makeSession());
    mock.onPost("/auth/login").reply(401, { detail: "Invalid email or password." });

    await expect(api.post("/auth/login", {})).rejects.toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retries a request at most once", async () => {
    sessionManager.saveSession(user, makeSession());
    mock.onGet("/dashboard").reply(401, { detail: "Your session has expired." });

    await expect(api.get("/dashboard")).rejects.toBeDefined();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mock.history.get).toHaveLength(2);
  });

  it("does not refresh an unrelated 401", async () => {
    sessionManager.saveSession(user, makeSession());
    mock.onGet("/dashboard").reply(401, { detail: "Invalid email or password." });

    await expect(api.get("/dashboard")).rejects.toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
