import { motion } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";

const stats = [
  { value: 8, suffix: "+", label: "AI Modules" },
  { value: 840, suffix: "+", label: "Assessment Questions" },
  { value: 480, suffix: "+", label: "Interview Questions" },
  { value: 15, suffix: "+", label: "Career Roles" },
  { value: 100, suffix: "%", label: "AI Powered" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function Stats() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="
            grid grid-cols-2 md:grid-cols-5 gap-6
            rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl
            p-8 md:p-12
          "
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="flex flex-col items-center text-center gap-2"
            >
              <span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </span>
              <span className="text-gray-400 text-sm md:text-base font-medium">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
