import { motion } from "framer-motion";

export default function ProfileLayout({
  title,
  subtitle,
  step,
  totalSteps,
  children,
}) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="relative min-h-screen bg-[#050816] overflow-hidden">

      {/* Background Glow */}

      <div className="absolute -top-44 -left-40 w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-[180px]" />

      <div className="absolute bottom-[-200px] right-[-120px] w-[550px] h-[550px] rounded-full bg-fuchsia-600/20 blur-[180px]" />

      {/* Grid */}

      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main */}

      <div className="relative z-10 min-h-screen flex justify-center items-center px-6 py-12">

        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: .7,
          }}
          className="
            w-full
            max-w-3xl
            rounded-[32px]
            bg-white/5
            backdrop-blur-2xl
            border
            border-white/10
            shadow-[0_20px_70px_rgba(0,0,0,.45)]
            p-10
          "
        >

          {/* Logo */}

          <h1 className="text-center text-4xl font-black">

            <span className="text-white">

              Career

            </span>

            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">

              Lens AI

            </span>

          </h1>

          {/* Progress */}

          <div className="mt-10">

            <div className="flex justify-between text-gray-400 mb-3">

              <span>

                Step {step}

              </span>

              <span>

                {totalSteps}

              </span>

            </div>

            <div className="w-full h-3 rounded-full bg-white/10">

              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${progress}%`,
                }}
                transition={{
                  duration: .6,
                }}
                className="
                  h-3
                  rounded-full
                  bg-gradient-to-r
                  from-violet-500
                  to-fuchsia-500
                "
              />

            </div>

          </div>

          {/* Heading */}

          <h2 className="text-4xl text-white font-bold mt-10">

            {title}

          </h2>

          <p className="text-gray-400 mt-3 mb-10">

            {subtitle}

          </p>

          {/* Step */}

          {children}

        </motion.div>

      </div>

    </div>
  );
}