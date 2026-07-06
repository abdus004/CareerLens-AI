import { motion } from "framer-motion";

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">

      {/* Main Background */}
      <div className="absolute inset-0 bg-[#050816]" />

      {/* Purple Glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
        className="
          absolute
          -top-52
          -left-40
          w-[650px]
          h-[650px]
          rounded-full
          bg-violet-700/30
          blur-[150px]
        "
      />

      {/* Blue Glow */}
      <motion.div
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
        className="
          absolute
          bottom-[-200px]
          right-[-150px]
          w-[600px]
          h-[600px]
          rounded-full
          bg-blue-600/20
          blur-[180px]
        "
      />

      {/* Grid */}
      <div
        className="
          absolute
          inset-0
          opacity-[0.05]
        "
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating dots */}
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [-15, 15, -15],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
          }}
          className="
            absolute
            rounded-full
            bg-violet-400
          "
          style={{
            width: 4,
            height: 4,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
}