import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

import BrandIcon from "./BrandIcon";
import ThemeToggle from "./landing/ThemeToggle";

const navItems = [
  { label: "Home", href: "#top" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why Us", href: "#why-us" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed top-5 left-1/2 -translate-x-1/2 w-[94%] max-w-7xl z-50"
    >
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.04 }}
          onClick={() => handleNavClick("#top")}
          className="flex items-center gap-3 cursor-pointer"
        >
          <BrandIcon size={34} />
          <h1 className="text-xl md:text-2xl font-black tracking-tight whitespace-nowrap">
            <span className="text-white">CareerLens</span>{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
        </motion.div>

        {/* Navigation */}
        <ul className="hidden lg:flex items-center gap-10">
          {navItems.map((item) => (
            <motion.li
              whileHover={{ y: -2 }}
              key={item.label}
              onClick={() => handleNavClick(item.href)}
              className="relative text-gray-300 hover:text-white cursor-pointer transition duration-300 group"
            >
              {item.label}
              <span className="absolute left-0 -bottom-2 w-0 h-[2px] bg-gradient-to-r from-violet-400 to-fuchsia-500 transition-all duration-300 group-hover:w-full" />
            </motion.li>
          ))}
        </ul>

        {/* Right: desktop actions */}
        <div className="hidden md:flex items-center gap-5">
          <ThemeToggle />

          <span className="h-6 w-px bg-white/10" aria-hidden="true" />

          <button
            onClick={() => navigate("/login")}
            className="text-gray-300 hover:text-white transition"
          >
            Sign In
          </button>

          <button
            onClick={() => navigate("/signup")}
            className="cl-btn cl-btn-primary px-5 py-3 rounded-xl font-semibold"
          >
            Get Started
          </button>
        </div>

        {/* Mobile: toggle stays visible next to the menu button */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />

          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="text-white p-2"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden mt-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col p-5 gap-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.href)}
                  className="text-left text-gray-300 hover:text-white transition"
                >
                  {item.label}
                </button>
              ))}

              <div className="h-px bg-white/10 my-1" />

              <button
                onClick={() => navigate("/login")}
                className="text-left text-gray-300 hover:text-white transition"
              >
                Sign In
              </button>

              <button
                onClick={() => navigate("/signup")}
                className="cl-btn cl-btn-primary px-5 py-3 rounded-xl font-semibold text-center"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
