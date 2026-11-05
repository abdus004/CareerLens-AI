const USER_KEY = "user";
const SESSION_KEY = "session";
const REVISION_KEY = "session_revision";
const REFRESH_LOCK_KEY = "careerlens_refresh_lock";
const CHANNEL_NAME = "careerlens_session";
const REFRESH_LOCK_TTL_MS = 15_000;
const EXPIRY_SKEW_SECONDS = 30;

const canUseBrowserStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";
const apiBaseUrl = () => import.meta.env.VITE_API_URL || "";

let refreshInFlight = null;
let channel = null;
let listenersBound = false;
const sessionListeners = new Set();

function notifySessionChange() {
  sessionListeners.forEach((listener) => listener());
}

function parse(storage, key) {
  try {
    return JSON.parse(storage.getItem(key));
  } catch {
    return null;
  }
}

function isUsableSession(session) {
  return Boolean(
    session && typeof session.access_token === "string" && session.access_token &&
      typeof session.refresh_token === "string" && session.refresh_token
  );
}

function storageForName(name) {
  if (!canUseBrowserStorage()) return null;
  return name === "local" ? window.localStorage : window.sessionStorage;
}

function storedRecord(name) {
  const storage = storageForName(name);
  if (!storage) return null;
  const session = parse(storage, SESSION_KEY);
  const user = parse(storage, USER_KEY);
  if (!isUsableSession(session) || !user) return null;
  return { user, session, storage: name, revision: Number(storage.getItem(REVISION_KEY) || 0) };
}

function removeFrom(storage) {
  if (!storage) return;
  storage.removeItem(USER_KEY);
  storage.removeItem(SESSION_KEY);
  storage.removeItem(REVISION_KEY);
}

function postMessage(message) {
  ensureCoordination();
  channel?.postMessage(message);
}

function writeRecord(record, { broadcast = true } = {}) {
  const storage = storageForName(record.storage);
  if (!storage || !isUsableSession(record.session) || !record.user) return false;
  storage.setItem(USER_KEY, JSON.stringify(record.user));
  storage.setItem(SESSION_KEY, JSON.stringify(record.session));
  storage.setItem(REVISION_KEY, String(record.revision));
  notifySessionChange();
  if (broadcast) postMessage({ type: "session_updated", ...record });
  return true;
}

function applyRemoteSession(record) {
  const current = getSessionRecord();
  // Never create a session in a logged-out tab. A same-account tab receives
  // rotated tokens in its own existing storage, preserving Remember Me.
  if (!current || current.user?.email?.toLowerCase() !== record.user?.email?.toLowerCase()) return;
  if (current.revision >= record.revision) return;
  writeRecord({ ...record, storage: current.storage }, { broadcast: false });
}

function applyRemoteLogout(message) {
  const current = getSessionRecord();
  if (current && (!message.email || current.user?.email?.toLowerCase() === message.email.toLowerCase())) {
    clearSession({ broadcast: false });
  }
}

function ensureCoordination() {
  if (!canUseBrowserStorage() || listenersBound) return;
  listenersBound = true;
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = ({ data }) => {
      if (data?.type === "session_updated") applyRemoteSession(data);
      if (data?.type === "session_cleared") applyRemoteLogout(data);
    };
  }
  window.addEventListener("storage", (event) => {
    if (event.key === SESSION_KEY || event.key === REVISION_KEY) {
      const remote = storedRecord("local");
      if (remote) applyRemoteSession(remote);
    }
  });
}

export function getSessionRecord() {
  ensureCoordination();
  return storedRecord("local") || storedRecord("session");
}

export function getCurrentUser() { return getSessionRecord()?.user || null; }
export function getCurrentSession() { return getSessionRecord()?.session || null; }
export function getRememberMePreference() { return getSessionRecord()?.storage === "local"; }

export function clearSession({ broadcast = true } = {}) {
  const email = getSessionRecord()?.user?.email || null;
  if (!canUseBrowserStorage()) return;
  removeFrom(window.localStorage);
  removeFrom(window.sessionStorage);
  notifySessionChange();
  if (broadcast) postMessage({ type: "session_cleared", email });
}

export function saveSession(user, session, rememberMe) {
  clearSession({ broadcast: false });
  writeRecord({ user, session, storage: rememberMe ? "local" : "session", revision: Date.now() });
}

export function subscribeToSessionChanges(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

export function isAccessTokenExpired(session = getCurrentSession(), nowSeconds = Date.now() / 1000) {
  const expiresAt = Number(session?.expires_at);
  return Number.isFinite(expiresAt) && expiresAt <= nowSeconds + EXPIRY_SKEW_SECONDS;
}

function makeSessionError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function defaultRefreshRequest(refreshToken) {
  const response = await fetch(`${apiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  let payload = null;
  try { payload = await response.json(); } catch { /* use a safe fallback */ }
  if (!response.ok) throw makeSessionError(payload?.detail || "Unable to refresh your session.", response.status);
  return payload;
}

async function withFallbackCrossTabLock(callback) {
  if (!canUseBrowserStorage()) return callback();
  const owner = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let existing = parse(window.localStorage, REFRESH_LOCK_KEY);
  // Web Locks is preferable. In browsers without it, wait for the other
  // tab's short-lived lease to clear so its BroadcastChannel update can land
  // before this tab reads a refresh token. The lease contains no credentials.
  while (existing?.expiresAt > Date.now()) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    existing = parse(window.localStorage, REFRESH_LOCK_KEY);
  }
  window.localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify({ owner, expiresAt: Date.now() + REFRESH_LOCK_TTL_MS }));
  try { return await callback(); } finally {
    if (parse(window.localStorage, REFRESH_LOCK_KEY)?.owner === owner) window.localStorage.removeItem(REFRESH_LOCK_KEY);
  }
}

async function withRefreshLock(callback) {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("careerlens-session-refresh", { mode: "exclusive" }, callback);
  }
  return withFallbackCrossTabLock(callback);
}

export function refreshSession({ request = defaultRefreshRequest } = {}) {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = withRefreshLock(async () => {
    const before = getSessionRecord();
    if (!before) throw makeSessionError("No session is available to refresh.", 401);
    const refreshToken = before.session.refresh_token;
    const payload = await request(refreshToken);
    if (!payload?.session || !payload?.user || !isUsableSession(payload.session)) {
      throw makeSessionError("The refresh service returned an invalid session.", 500);
    }
    const current = getSessionRecord();
    // Do not overwrite a newer token rotation delivered by another tab.
    if (current && current.session.refresh_token !== refreshToken && current.revision > before.revision) return current.session;
    const updated = { user: payload.user, session: payload.session, storage: before.storage, revision: Date.now() };
    writeRecord(updated);
    return updated.session;
  }).finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

export async function restoreSession(options) {
  const record = getSessionRecord();
  if (!record) return { status: "missing", session: null };
  if (!isAccessTokenExpired(record.session)) return { status: "authenticated", session: record.session };
  try {
    return { status: "authenticated", session: await refreshSession(options) };
  } catch (error) {
    if (error?.status === 401) {
      clearSession();
      return { status: "expired", session: null };
    }
    return { status: "unavailable", session: null, error };
  }
}

export async function logoutSession() {
  const record = getSessionRecord();
  // Clear first: protected views disappear even if the backend is unavailable.
  clearSession();
  if (!record) return;
  try {
    await fetch(`${apiBaseUrl()}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${record.session.access_token}` },
      body: JSON.stringify({ refresh_token: record.session.refresh_token }),
    });
  } catch {
    // Local cleanup remains authoritative for this browser.
  }
}
