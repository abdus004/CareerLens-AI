import { motion } from "framer-motion";

export default function AuthLayout({
  title,
  subtitle,
  children,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816]">

      {/* Background Glow */}

      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-700/25 blur-[180px]" />

      <div className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-fuchsia-600/20 blur-[180px]" />

      {/* Grid */}

      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main Content */}

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">

        <motion.div
          initial={{
            opacity: 0,
            y: 60,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.8,
          }}
          className="
            w-full
            max-w-md
            rounded-[30px]
            border
            border-white/10
            bg-white/5
            backdrop-blur-2xl
            shadow-[0_20px_60px_rgba(0,0,0,.45)]
            p-8
          "
        >

          {/* Logo */}

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="
              text-center
              text-4xl
              font-black
              tracking-tight
              mb-3
            "
          >

            <span className="text-white">

              Career

            </span>

            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">

              Lens AI

            </span>

          </motion.h1>

          {/* Heading */}

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: .3 }}
            className="
              text-white
              text-3xl
              font-bold
              text-center
              mt-5
            "
          >
            {title}
          </motion.h2>

          {/* Subtitle */}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: .5 }}
            className="
              text-gray-400
              text-center
              mt-4
              leading-7
            "
          >
            {subtitle}
          </motion.p>

          {/* Form */}

          <div className="mt-7">

            {children}

          </div>

        </motion.div>

      </div>

    </div>
  );
}