import { createContext } from "react";

// Split out from ProfileContext.jsx (which keeps the ProfileProvider
// component) and hooks/useProfile.js (which keeps the useProfile hook)
// so neither of those two files mixes a component export with a
// non-component export - that mix is exactly what breaks Vite Fast
// Refresh for a file, hence react-refresh/only-export-components.
export const ProfileContext = createContext();
