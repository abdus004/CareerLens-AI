import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { getCurrentUser } from "../utils/session";

// Settings > Appearance.
//
// Applies/removes the `light` class on <html> - see index.css for the
// centralized override block that actually re-skins the app. Reads
// synchronously from localStorage on first render so there is no
// flash of the wrong theme before React even commits.
//
// Cross-device persistence (profiles.theme_preference) is deliberately
// NOT fetched here with its own network call - DashboardLayout already
// loads the full profile once per session via ProfileContext, and
// reconciles the theme from that same response (see DashboardLayout.jsx).
// That keeps this to a single GET /profile/{email} for the whole app
// instead of two.

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

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // persist=true (default): user explicitly switched theme in Settings,
  // save it to their profile too.
  // persist=false: reconciling FROM the profile that was just loaded -
  // just apply it locally, no need to write the same value straight back.
  const setTheme = useCallback((nextTheme, persist = true) => {
    if (nextTheme !== "light" && nextTheme !== "dark") return;

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

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
