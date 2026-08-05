import { motion } from "framer-motion";
import { SiReact, SiFastapi, SiPython, SiSupabase, SiTailwindcss } from "react-icons/si";
import { Sparkles } from "lucide-react";

import SectionHeading from "./SectionHeading";

const stack = [
  { icon: SiReact, name: "React", color: "#61DAFB" },
  { icon: SiFastapi, name: "FastAPI", color: "#009688" },
  { icon: SiPython, name: "Python", color: "#3776AB" },
  { icon: SiSupabase, name: "Supabase", color: "#3ECF8E" },
  { icon: Sparkles, name: "Gemini AI", color: "#a78bfa" },
  { icon: SiTailwindcss, name: "Tailwind CSS", color: "#38BDF8" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function TechStack() {
  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="Under The Hood"
          title="Built With A"
          highlight="Modern, Reliable Stack"
          subtitle="Production-grade technology chosen for speed, reliability, and real AI capability - not just for show."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6"
        >
          {stack.map((tech, index) => {
            const Icon = tech.icon;
            return (
              <motion.div
                key={tech.name}
                variants={itemVariants}
                whileHover={{ y: -6 }}
                className="group relative flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 transition-all duration-300 hover:border-white/25"
              >
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                  style={{ backgroundColor: `${tech.color}22` }}
                  aria-hidden="true"
                />

                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 3 + (index % 3) * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative z-10"
                >
                  <Icon size={40} color={tech.color} />
                </motion.div>

                <span className="relative z-10 text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                  {tech.name}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
