import { motion } from "framer-motion";
import { Brain, FileText, GraduationCap, MessageSquare, Award, Layers } from "lucide-react";

import SectionHeading from "./SectionHeading";

const reasons = [
  {
    icon: Brain,
    title: "AI Powered Career Guidance",
    description: "Every recommendation is grounded in your actual profile - not generic advice.",
  },
  {
    icon: FileText,
    title: "Resume Analysis",
    description: "Instant, detailed feedback that goes far beyond a simple ATS score.",
  },
  {
    icon: Layers,
    title: "Placement Preparation",
    description: "Track drives and opportunities that genuinely match where you stand.",
  },
  {
    icon: MessageSquare,
    title: "Interview Practice",
    description: "Practice with an AI interviewer until real interviews feel routine.",
  },
  {
    icon: Award,
    title: "Certification Roadmap",
    description: "Earn verifiable certificates that prove your skills, not just claim them.",
  },
  {
    icon: GraduationCap,
    title: "Industry Ready Learning",
    description: "A learning path built around the gaps that actually matter for hiring.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function WhyCareerLens() {
  return (
    <section id="why-us" className="relative py-28 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="Why CareerLens AI"
          title="Built To Actually"
          highlight="Get You Placed"
          subtitle="Not another generic career quiz - a complete, AI-driven system built around real placement outcomes."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <motion.div
                key={reason.title}
                variants={cardVariants}
                whileHover={{ y: -6 }}
                className="
                  group relative overflow-hidden rounded-3xl
                  border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02]
                  backdrop-blur-2xl p-8
                  transition-all duration-300
                  hover:border-cyan-400/30
                  hover:shadow-[0_15px_40px_rgba(34,211,238,.12)]
                "
              >
                <div className="relative w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:border-cyan-400/40 transition-colors">
                  <Icon size={22} className="text-cyan-300" />
                </div>

                <h3 className="text-lg font-bold text-white mb-3">{reason.title}</h3>
                <p className="text-gray-400 text-sm leading-7">{reason.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
