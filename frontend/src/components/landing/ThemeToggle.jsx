import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useTheme } from "../../context/ThemeContext";

/**
 * Premium glass capsule Sun/Moon toggle for the landing page Navbar.
 *
 * Reads/writes the SAME ThemeContext used by Settings > Appearance -
 * there is only ever one ThemeProvider (see main.jsx), so flipping
 * this switch here or the cards in Settings both update `theme`
 * instantly everywhere else in the app (see index.css's `html.light`
 * rules), and both persist through the same setTheme() call
 * (localStorage + profiles.theme_preference).
 *
 * All visuals (track, thumb, glow) come from the .cl-theme-toggle-*
 * classes in index.css, built on the --cl-* design tokens - so the
 * toggle itself re-skins automatically with the rest of the app.
 */
export default function ThemeToggle({ className = "" }) {
  const { theme, setTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className={`cl-theme-toggle ${className}`}
    >
      <motion.span
        className="cl-theme-toggle-thumb"
        animate={{ x: isLight ? 28 : 0 }}
        transition={{ type: "spring", stiffness: 480, damping: 30 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isLight ? (
            <motion.span
              key="sun"
              initial={{ opacity: 0, rotate: -90, scale: 0.4 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <Sun size={14} className="text-white" strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <Moon size={13} className="text-white" strokeWidth={2.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
