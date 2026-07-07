import {
  Brain,
  Target,
  Map,
  FileText,
  BarChart3,
  Briefcase,
} from "lucide-react";

import { motion } from "framer-motion";

const features = [
  {
    icon: Brain,
    title: "AI Career Recommendations",
    description:
      "Receive personalized career suggestions based on your education, skills, interests and goals.",
  },
  {
    icon: Target,
    title: "Career Match Score",
    description:
      "Discover how well your profile matches different IT careers with AI-powered compatibility scoring.",
  },
  {
    icon: Map,
    title: "Personalized Learning Roadmap",
    description:
      "Follow a customized roadmap that guides you from beginner to industry-ready professional.",
  },
  {
    icon: FileText,
    title: "AI Resume Analyzer",
    description:
      "Upload your resume and receive instant AI feedback with ATS scoring and improvement suggestions.",
  },
  {
    icon: BarChart3,
    title: "Skill Gap Analysis",
    description:
      "Identify missing technical skills and receive recommendations to improve your profile.",
  },
  {
    icon: Briefcase,
    title: "Placement & Job Opportunities",
    description:
      "Explore internships and placements that match your profile and career goals.",
  },
];

const containerVariants = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 45,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function Features() {
  return (
    <section
      id="features"
      className="relative py-28 px-6 overflow-hidden"
    >

      {/* Background Glow */}

      <div className="absolute inset-0 -z-10">

        <div className="absolute top-24 left-24 w-96 h-96 rounded-full bg-violet-700/10 blur-[140px]" />

        <div className="absolute bottom-24 right-20 w-[420px] h-[420px] rounded-full bg-cyan-500/10 blur-[150px]" />

      </div>

      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.7,
          }}
          className="text-center mb-20"
        >

          <p className="text-violet-400 font-semibold tracking-[0.25em] uppercase mb-5">

            CareerLens AI

          </p>

          <h2 className="text-5xl md:text-6xl font-black text-white leading-tight">

            Everything You Need

            <span className="block mt-2 bg-gradient-to-r from-violet-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">

              To Build Your Career

            </span>

          </h2>

          <p className="max-w-3xl mx-auto mt-8 text-gray-400 text-xl leading-9">

            CareerLens AI combines AI-powered career guidance,
            resume analysis, learning roadmaps, placement
            opportunities and skill analysis into one
            intelligent platform.

          </p>

        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.15,
          }}
          className="grid lg:grid-cols-3 md:grid-cols-2 gap-8"
        >          {features.map((feature, index) => {

            const Icon = feature.icon;

            return (

              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                }}
                transition={{
                  duration: 0.25,
                }}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-3xl
                  border
                  border-white/10
                  bg-white/[0.05]
                  backdrop-blur-2xl
                  p-8
                  transition-all
                  duration-300
                  hover:border-violet-400/40
                  hover:shadow-[0_15px_40px_rgba(139,92,246,.18)]
                "
              >

                {/* Glow Overlay */}

                <div
                  className="
                    absolute
                    inset-0
                    opacity-0
                    group-hover:opacity-100
                    transition-opacity
                    duration-500
                    bg-gradient-to-br
                    from-violet-500/10
                    via-transparent
                    to-cyan-500/10
                  "
                />

                {/* Icon */}

                <div
                  className="
                    relative
                    w-16
                    h-16
                    rounded-2xl
                    bg-gradient-to-br
                    from-violet-600
                    to-fuchsia-600
                    flex
                    items-center
                    justify-center
                    mb-7
                    shadow-[0_8px_25px_rgba(139,92,246,.25)]
                    transition-all
                    duration-300
                    group-hover:scale-105
                    group-hover:shadow-[0_10px_35px_rgba(139,92,246,.35)]
                  "
                >

                  <Icon
                    size={30}
                    className="text-white"
                  />

                </div>

                {/* Title */}

                <h3 className="relative text-2xl font-bold text-white mb-4">

                  {feature.title}

                </h3>

                {/* Description */}

                <p className="relative text-gray-400 leading-8">

                  {feature.description}

                </p>

              </motion.div>

            );

          })}

        </motion.div>

      </div>

    </section>
  );
}