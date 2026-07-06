import { motion } from "framer-motion";

const navItems = ["Home", "Features", "About", "Contact"];

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed top-5 left-1/2 -translate-x-1/2 w-[94%] max-w-7xl z-50"
    >
      <nav className="flex items-center justify-between px-8 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl">

        {/* Logo */}

        <motion.h1
          whileHover={{ scale: 1.04 }}
          className="text-3xl font-black tracking-tight cursor-pointer"
        >
          <span className="text-white">Career</span>

          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
            Lens AI
          </span>
        </motion.h1>

        {/* Navigation */}

        <ul className="hidden lg:flex items-center gap-10">

          {navItems.map((item) => (

            <motion.li
              whileHover={{ y: -2 }}
              key={item}
              className="relative text-gray-300 hover:text-white cursor-pointer transition duration-300 group"
            >

              {item}

              <span className="absolute left-0 -bottom-2 w-0 h-[2px] bg-gradient-to-r from-violet-400 to-fuchsia-500 transition-all duration-300 group-hover:w-full"></span>

            </motion.li>

          ))}

        </ul>

        {/* Right */}

        <div className="flex items-center gap-4">

          <button className="text-gray-300 hover:text-white transition">
            Sign In
          </button>

          <button className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:scale-105 transition shadow-[0_0_25px_rgba(139,92,246,.4)]">

            Get Started

          </button>

        </div>

      </nav>
    </motion.header>
  );
}