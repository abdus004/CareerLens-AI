import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import api from "../services/api";
import { getCurrentUser } from "../utils/session";

// Settings > Appearance - the ONE global source of truth for theme.
//
// Applies/removes the `light` class on <html> - see index.css for the
// centralized semantic-variable override block that actually re-skins
// the whole app from that single class. Reads synchronously from
// localStorage on first render so there's no flash of the wrong theme
// before React even commits.
//
// IMPORTANT BUG THIS FIXES: reconciling the theme against the profile
// fetched from the backend must only ever happen ONCE per app session.
// DashboardLayout (which loads the profile) remounts on every page
// navigation - if reconciliation re-ran on every one of those mounts,
// it would keep comparing against a ProfileContext snapshot that never
// gets updated after a local theme change, and would silently revert
// the theme back to the old value the instant you navigated anywhere.
// `reconciledRef` below guards against exactly that; once a value has
// been applied (from the user, or from the server), nothing can
// silently overwrite it again for the rest of the session.

const ThemeContext = createContext();
const STORAGE_KEY = "clens_theme";

function applyThemeClass(theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
  } else {
    root.classList.remove("light");
  }
}

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function hasStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(readStoredTheme);
  const reconciledRef = useRef(false);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // persist=true (default): the user explicitly switched theme in
  // Settings - save it to their profile so it follows them to other
  // devices/browsers too.
  // persist=false: applying a value that already came FROM the server
  // (see reconcileFromProfile) - just apply it locally, no need to
  // write the same value straight back.
  const setTheme = useCallback((nextTheme, persist = true) => {
    if (nextTheme !== "light" && nextTheme !== "dark") return;

    // Any known-good value, local or remote, permanently supersedes
    // reconciliation from here on - see reconcileFromProfile.
    reconciledRef.current = true;

    setThemeState(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      /* ignore - theme just won't survive a hard refresh on this device */
    }

    if (!persist) return;

    const user = getCurrentUser();
    if (!user?.email) return;

    api
      .put("/settings/theme", {
        email: user.email,
        theme_preference: nextTheme,
      })
      .catch(() => {
        /* non-fatal - the theme still applied locally for this session */
      });
  }, []);

  // Called by DashboardLayout once per session, right after the profile
  // finishes loading. Deliberately a no-op on every call after the
  // first (reconciledRef), AND a no-op if this browser already has a
  // cached preference (hasStoredTheme) - the server's saved value only
  // matters for a brand new device/browser that has nothing cached yet.
  // That means it can never fight with, or silently revert, a theme the
  // person already has applied or has just picked.
  const reconcileFromProfile = useCallback((remoteTheme) => {
    if (reconciledRef.current) return;
    reconciledRef.current = true;

    if (remoteTheme !== "light" && remoteTheme !== "dark") return;
    if (hasStoredTheme()) return;

    setThemeState(remoteTheme);
    try {
      localStorage.setItem(STORAGE_KEY, remoteTheme);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, reconcileFromProfile }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
