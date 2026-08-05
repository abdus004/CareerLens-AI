import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SIZES = {
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap";

const VARIANTS = {
  primary:
    "text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 shadow-[0_0_30px_rgba(139,92,246,.4)] hover:shadow-[0_0_45px_rgba(139,92,246,.6)]",
  secondary:
    "text-white border border-white/15 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/25",
};

/**
 * Shared CTA button used across the landing page (Hero, Navbar, final
 * CTA section). Renders as a react-router <Link> when `to` is given,
 * a plain anchor when `href` is given, or a <button> otherwise -
 * covers every use case on the page without each section rolling its
 * own button markup.
 */
export default function CTAButton({
  children,
  primary = true,
  variant,
  size = "lg",
  to,
  href,
  onClick,
  icon: Icon,
  className = "",
  ...rest
}) {
  const resolvedVariant = variant || (primary ? "primary" : "secondary");
  const classes = `${BASE} ${SIZES[size] || SIZES.lg} ${VARIANTS[resolvedVariant]} ${className}`;

  const content = (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className={classes}
    >
      {children}
      {Icon && <Icon size={18} />}
    </motion.span>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block" {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className="inline-block" {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className="inline-block" {...rest}>
      {content}
    </button>
  );
}
