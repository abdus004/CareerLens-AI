import {
  FileText,
  Compass,
  BarChart3,
  Map,
  MessageSquare,
  ClipboardCheck,
  Building2,
  Award,
} from "lucide-react";

import { motion } from "framer-motion";
import SectionHeading from "./landing/SectionHeading";

const features = [
  {
    icon: FileText,
    title: "Resume Analyzer",
    description:
      "Upload your resume and get instant AI feedback with ATS scoring and concrete improvement suggestions.",
  },
  {
    icon: Compass,
    title: "Career Intelligence",
    description:
      "Personalized career recommendations based on your education, skills, interests, and goals.",
  },
  {
    icon: BarChart3,
    title: "Skill Analysis",
    description:
      "Identify skill gaps against your target roles and see exactly where to focus next.",
  },
  {
    icon: Map,
    title: "Learning Path",
    description:
      "Follow a personalized, structured roadmap that takes you from beginner to industry-ready.",
  },
  {
    icon: MessageSquare,
    title: "AI Mock Interview",
    description:
      "Practice real interview scenarios with an AI interviewer and get detailed, actionable feedback.",
  },
  {
    icon: ClipboardCheck,
    title: "Skill Assessment",
    description:
      "Take timed assessments across programming, aptitude, and core CS topics to benchmark your skills.",
  },
  {
    icon: Building2,
    title: "Upcoming Drives",
    description:
      "Stay on top of placement drives and opportunities that match your profile, all in one place.",
  },
  {
    icon: Award,
    title: "Certificates",
    description:
      "Earn verifiable certificates as you pass assessments and build a portfolio employers trust.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 45 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Features() {
  return (
    <section id="features" className="relative py-28 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="CareerLens AI"
          title="Everything You Need"
          highlight="To Build Your Career"
          subtitle="Eight AI-powered modules that take you from resume to placement - resume analysis, career guidance, skill benchmarking, interview practice, and verifiable certificates, all in one platform."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid lg:grid-cols-4 md:grid-cols-2 gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.25 }}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-3xl
                  border
                  border-white/10
                  bg-white/[0.05]
                  backdrop-blur-2xl
                  p-7
                  transition-all
                  duration-300
                  hover:border-violet-400/40
                  hover:shadow-[0_15px_40px_rgba(139,92,246,.18)]
                "
              >
                {/* Glow Overlay */}
                <div
                  className="
                    absolute inset-0 opacity-0 group-hover:opacity-100
                    transition-opacity duration-500
                    bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10
                  "
                />

                {/* Icon */}
                <div
                  className="
                    relative w-14 h-14 rounded-2xl
                    bg-gradient-to-br from-violet-600 to-fuchsia-600
                    flex items-center justify-center mb-6
                    shadow-[0_8px_25px_rgba(139,92,246,.25)]
                    transition-all duration-300
                    group-hover:scale-105
                    group-hover:shadow-[0_10px_35px_rgba(139,92,246,.35)]
                  "
                >
                  <Icon size={26} className="text-white" />
                </div>

                {/* Title */}
                <h3 className="relative text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="relative text-gray-400 leading-7 text-sm">
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
