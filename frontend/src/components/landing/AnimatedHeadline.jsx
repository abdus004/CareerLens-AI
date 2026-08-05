import { motion } from "framer-motion";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.15 },
  },
};

const word = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Word-by-word reveal for the Hero headline. `lines` is an array of
 * lines, each an array of { text, gradient? } word tokens - gradient
 * words render with the existing brand gradient-text treatment
 * (matches the "With AI" span already used pre-redesign), everything
 * else renders plain white. Pass `nowrap` to guarantee a line never
 * breaks across multiple lines (used for the one-line "CareerLens AI"
 * brand name), regardless of viewport width - the caller is
 * responsible for sizing the font small enough to still fit.
 */
export default function AnimatedHeadline({ lines, className = "", nowrap = false }) {
  return (
    <motion.h1
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {lines.map((line, lineIndex) => (
        <span
          key={lineIndex}
          className={nowrap ? "block whitespace-nowrap" : "block"}
        >
          {line.map((token, tokenIndex) => (
            <motion.span
              key={tokenIndex}
              variants={word}
              className={
                token.gradient
                  ? "inline-block bg-gradient-to-r from-violet-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(139,92,246,.35)]"
                  : "inline-block text-white"
              }
            >
              {token.text}
              {tokenIndex < line.length - 1 ? "\u00A0" : ""}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.h1>
  );
}
