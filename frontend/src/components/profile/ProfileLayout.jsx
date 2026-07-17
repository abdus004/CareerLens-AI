import { motion } from "framer-motion";

export default function ProfileLayout({
  title,
  subtitle,
  step,
  totalSteps,
  children,
}) {
  const progress = (step / totalSteps) * 100;

  const steps = [
    "User Type",
    "Basic Info",
    "Education",
    "Career Goals",
    "Skills",
    "Portfolio",
  ];

  return (
    <div className="relative min-h-screen bg-[#050816] overflow-hidden">

      {/* Background Glow */}

      <div className="absolute -top-60 -left-40 w-[550px] h-[550px] rounded-full bg-violet-700/20 blur-[180px]" />

      <div className="absolute bottom-[-250px] right-[-150px] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[180px]" />

      {/* Grid */}

      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 min-h-screen flex">

        {/* LEFT PANEL */}

        <div
          className="
            hidden
            lg:flex
            w-[340px]
            border-r
            border-white/10
            bg-white/5
            backdrop-blur-2xl
            flex-col
            justify-between
            p-10
          "
        >

          <div>

            <h1 className="text-4xl font-black">

              <span className="text-white">
                Career
              </span>

              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                Lens AI
              </span>

            </h1>

            <p className="text-gray-400 mt-3 leading-7">
              Complete your profile to receive
              personalized AI career recommendations.
            </p>

            {/* Progress */}

            <div className="mt-12">

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
                    to-cyan-500
                  "
                />

              </div>

            </div>

            {/* Steps */}

            <div className="mt-12 space-y-6">

              {steps.map((item, index) => (

                <div
                  key={index}
                  className="flex items-center gap-4"
                >

                  <div
                    className={`
                      w-10
                      h-10
                      rounded-full
                      flex
                      items-center
                      justify-center
                      font-bold
                      transition

                      ${
                        step > index
                          ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white"
                          : "bg-white/10 text-gray-400"
                      }
                    `}
                  >
                    {index + 1}
                  </div>

                  <span
                    className={`
                      ${
                        step > index
                          ? "text-white"
                          : "text-gray-500"
                      }
                    `}
                  >
                    {item}
                  </span>

                </div>

              ))}

            </div>

          </div>

          <p className="text-gray-500 text-sm">
            © 2026 CareerLens AI
          </p>

        </div>

        {/* RIGHT PANEL */}

        <div
          className="
            flex-1
            flex
            items-center
            justify-center
            p-8
            lg:p-14
          "
        >

          <motion.div
            initial={{
              opacity: 0,
              x: 30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: .6,
            }}
            className="
              w-full
              max-w-6xl
              rounded-[35px]
              border
              border-white/10
              bg-white/5
              backdrop-blur-3xl
              p-10
              lg:p-14
            "
          >

            <h2 className="text-5xl font-bold text-white">

              {title}

            </h2>

            <p className="text-gray-400 mt-3 mb-10 text-lg">

              {subtitle}

            </p>

            {children}

          </motion.div>

        </div>

      </div>

    </div>
  );
}