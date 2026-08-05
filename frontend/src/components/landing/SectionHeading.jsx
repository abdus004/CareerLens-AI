import { motion } from "framer-motion";

/**
 * Shared section header used across every new landing page section
 * (Features, How It Works, Stats, Tech Stack, Why CareerLens AI, CTA).
 * Mirrors the eyebrow/heading/subheading pattern already established
 * in the existing Features.jsx, so every section reads as part of the
 * same design system instead of a one-off.
 */
export default function SectionHeading({
  eyebrow,
  title,
  highlight,
  subtitle,
  align = "center",
}) {
  const isCenter = align === "center";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className={isCenter ? "text-center mb-16" : "text-left mb-16"}
    >
      {eyebrow && (
        <p className="text-violet-400 font-semibold tracking-[0.25em] uppercase mb-5 text-sm">
          {eyebrow}
        </p>
      )}

      <h2
        className={`text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight ${
          isCenter ? "mx-auto" : ""
        }`}
      >
        {title}
        {highlight && (
          <span className="block mt-2 bg-gradient-to-r from-violet-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
            {highlight}
          </span>
        )}
      </h2>

      {subtitle && (
        <p
          className={`mt-8 text-gray-400 text-lg md:text-xl leading-8 md:leading-9 ${
            isCenter ? "max-w-3xl mx-auto" : "max-w-2xl"
          }`}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
