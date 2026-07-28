// Single source of truth for reading, writing, and clearing the
// logged-in user's session.
//
// Previously, six different files each reimplemented the same
// "localStorage.getItem('user') || sessionStorage.getItem('user')"
// read, and none of the three write/clear sites (Login, Signup,
// Sidebar's logout) ever cleared the storage location they weren't
// using. Since localStorage is always checked first, any leftover
// entry there from a previous login - even after a "successful"
// logout, since logout only ever cleared unrelated keys - would
// silently take priority over a fresh, correct session in
// sessionStorage. That combination is what caused the previous
// account's data to keep appearing after logging into a different
// one.
//
// Every page should go through this file instead of touching
// localStorage/sessionStorage directly.

const USER_KEY = "user";
const SESSION_KEY = "session";

// Removes any trace of a logged-in user from BOTH storages. Used on
// logout, and internally before every fresh login/signup write, so a
// leftover entry in the storage that isn't being used this time can
// never be picked up ahead of the current, correct session.
export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

// Saves a freshly authenticated user + session.
//
// rememberMe = true  -> localStorage (persists across browser restarts)
// rememberMe = false -> sessionStorage (cleared when the tab/browser closes)
//
// Always clears both storages first. This is the actual fix: without
// it, switching Remember Me between logins (or simply logging into a
// different account) can leave a previous account's data behind for
// getCurrentUser()/getCurrentSession() to pick up.
export function saveSession(user, session, rememberMe) {
  clearSession();

  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getCurrentUser() {
  try {
    return (
      JSON.parse(localStorage.getItem(USER_KEY)) ||
      JSON.parse(sessionStorage.getItem(USER_KEY))
    );
  } catch {
    return null;
  }
}

export function getCurrentSession() {
  try {
    return (
      JSON.parse(localStorage.getItem(SESSION_KEY)) ||
      JSON.parse(sessionStorage.getItem(SESSION_KEY))
    );
  } catch {
    return null;
  }
}