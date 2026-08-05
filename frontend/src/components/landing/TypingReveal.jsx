import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * Simple typewriter reveal for the Hero subtitle. Falls back to
 * showing the full text immediately for users who prefer reduced
 * motion, and always renders the full text in a visually-hidden node
 * too so screen readers get the complete sentence right away instead
 * of a character stream.
 */
export default function TypingReveal({ text, className = "", startDelay = 0.6, speed = 28 }) {
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setVisibleChars(text.length);
      return;
    }

    let frame;
    const startTimeout = setTimeout(() => {
      let i = 0;
      const step = () => {
        i += 1;
        setVisibleChars(i);
        if (i < text.length) {
          frame = setTimeout(step, speed);
        }
      };
      step();
    }, startDelay * 1000);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(frame);
    };
  }, [text, startDelay, speed]);

  return (
    <p className={className} aria-label={text}>
      <span aria-hidden="true">
        {text.slice(0, visibleChars)}
        {visibleChars < text.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
            className="inline-block w-[2px] h-[1em] bg-violet-300 ml-1 align-middle"
          />
        )}
      </span>
    </p>
  );
}
