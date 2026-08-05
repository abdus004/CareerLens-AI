import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";

/**
 * Scroll-triggered count-up number for the Stats section. Built on
 * framer-motion (already a project dependency) instead of pulling in
 * a separate counter library like react-countup, since framer-motion
 * alone covers this cleanly - one fewer new dependency for the same
 * result.
 */
export default function AnimatedCounter({ value, suffix = "", prefix = "", duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(count, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [isInView, value, duration, count]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
