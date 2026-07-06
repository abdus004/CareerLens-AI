import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen bg-[#050816] overflow-hidden flex items-center">

      {/* Background Blur */}

      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-violet-700/30 blur-[170px] rounded-full"></div>

      <div className="absolute bottom-[-250px] right-[-200px] w-[550px] h-[550px] bg-fuchsia-700/20 blur-[190px] rounded-full"></div>

      {/* Grid */}

      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-7xl mx-auto w-full px-8 lg:px-14 relative z-20 flex justify-center">

        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
          }}
          className="
max-w-6xl
w-full
text-center
flex
flex-col
items-center
"
        >

          {/* Badge */}

          <motion.div
            initial={{ opacity: 0, scale: .8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: .4 }}
            className="
              inline-flex
              items-center
              gap-2
              px-5
              py-2
              rounded-full
              bg-white/5
              border
              border-violet-500/20
              backdrop-blur-xl
              text-violet-300
              mb-8
            "
          >

            🚀 CareerLens AI

          </motion.div>

          {/* Heading */}

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: .7 }}
            className="
            text-6xl
            md:text-8xl
            font-black
            leading-[1]
            tracking-tight
            text-white
          "
          >

            Discover

            <br />

            Your Future

            <br />

            <span
              className="
              bg-gradient-to-r
              from-violet-400
              via-fuchsia-500
              to-cyan-400
              bg-clip-text
              text-transparent
            "
            >
              With AI
            </span>

          </motion.h1>

          {/* Description */}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
className="
mt-8
text-gray-300
text-lg
md:text-xl
lg:text-[22px]
leading-9
max-w-4xl
mx-auto
font-normal
"
          >

            CareerLens AI helps students discover the perfect IT career,
            understand their strengths, explore opportunities,
            and build a personalized roadmap using Artificial Intelligence.

          </motion.p>
                    {/* Buttons */}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="
mt-16
flex
justify-center
items-center
gap-8
flex-wrap
"
          >

            <button
  onClick={() => navigate("/login")}
  className="
    px-8
    py-4
    rounded-2xl
    bg-gradient-to-r
    from-violet-600
    via-fuchsia-600
    to-purple-600
    text-white
    font-semibold
    text-lg
    shadow-[0_0_40px_rgba(139,92,246,.45)]
    hover:scale-105
    transition-all
    duration-300
  "
>
  Get Started →
</button>

            <button
              className="
                px-8
                py-4
                rounded-2xl
                border
                border-white/10
                bg-white/5
                backdrop-blur-xl
                text-white
                font-semibold
                hover:bg-white/10
                transition-all
                duration-300
              "
            >
              Learn More
            </button>

          </motion.div>

        </motion.div>

      </div>

      
    </section>
  );
}