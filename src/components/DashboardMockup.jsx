import { motion } from "framer-motion";

export default function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1 }}
      className="relative w-[540px] h-[600px]"
    >
      {/* Glow */}
      <div className="absolute inset-0 bg-violet-600/20 blur-3xl rounded-full"></div>

      {/* Main Card */}
      <motion.div
        animate={{
          y: [-10, 10, -10],
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: "easeInOut",
        }}
        className="
          relative
          rounded-[32px]
          bg-white/10
          backdrop-blur-2xl
          border
          border-white/10
          shadow-[0_20px_60px_rgba(0,0,0,.5)]
          p-8
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-white text-2xl font-bold">
              Career Dashboard
            </h2>

            <p className="text-gray-400 text-sm">
              AI Career Insights
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xl">
            AI
          </div>
        </div>

        {/* Career Match */}

        <div className="mb-8">

          <div className="flex justify-between mb-2">

            <span className="text-gray-300">
              Career Match
            </span>

            <span className="text-violet-300 font-semibold">
              92%
            </span>

          </div>

          <div className="h-3 bg-white/10 rounded-full">

            <div className="h-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 w-[92%]"></div>

          </div>

        </div>

        {/* Cards */}

        <div className="grid grid-cols-2 gap-5">

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">

            <p className="text-gray-400 text-sm">
              Resume Score
            </p>

            <h2 className="text-4xl text-white font-bold mt-2">
              84
            </h2>

          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">

            <p className="text-gray-400 text-sm">
              Skill Level
            </p>

            <h2 className="text-4xl text-white font-bold mt-2">
              76%
            </h2>

          </div>

        </div>

        {/* Recommended Role */}

        <div className="mt-8 rounded-2xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/20 p-6">

          <p className="text-gray-300">

            Recommended Role

          </p>

          <h2 className="text-white text-3xl font-bold mt-2">

            AI Engineer

          </h2>

          <p className="text-violet-300 mt-2">

            Based on your interests and skills.

          </p>

        </div>

        {/* Skills */}

        <div className="mt-8">

          <div className="flex justify-between text-gray-300">

            <span>Python</span>

            <span>90%</span>

          </div>

          <div className="h-2 bg-white/10 rounded-full mt-2 mb-4">

            <div className="h-2 rounded-full bg-violet-500 w-[90%]"></div>

          </div>

          <div className="flex justify-between text-gray-300">

            <span>Machine Learning</span>

            <span>70%</span>

          </div>

          <div className="h-2 bg-white/10 rounded-full mt-2">

            <div className="h-2 rounded-full bg-fuchsia-500 w-[70%]"></div>

          </div>

        </div>

      </motion.div>
    </motion.div>
  );
}