import { createContext } from "react";

// Split out from ThemeContext.jsx (which keeps the ThemeProvider
// component) and hooks/useTheme.js (which keeps the useTheme hook) -
// same reasoning as ProfileContextObject.js.
export const ThemeContext = createContext();
