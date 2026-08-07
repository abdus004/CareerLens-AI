import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SIZES = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const BASE =
  "cl-btn inline-flex items-center justify-center gap-2 rounded-2xl font-semibold whitespace-nowrap";

/**
 * Unified button system - every variant maps to a `.cl-btn-*` class in
 * index.css, which is built entirely from the --cl-* design tokens.
 * That means every variant automatically re-skins for the active
 * theme (dark/light) with zero logic here - this component only
 * chooses which class to apply.
 */
const VARIANTS = {
  primary: "cl-btn-primary",
  secondary: "cl-btn-secondary",
  outline: "cl-btn-outline",
  danger: "cl-btn-danger",
  success: "cl-btn-success",
};

/**
 * Shared CTA / action button used across the landing page (Hero,
 * Navbar, final CTA section) and available anywhere else in the app
 * that wants the same premium look. Renders as a react-router <Link>
 * when `to` is given, a plain anchor when `href` is given, or a
 * <button> otherwise - covers every use case without each section
 * rolling its own button markup.
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
  type = "button",
  disabled = false,
  className = "",
  ...rest
}) {
  const resolvedVariant = variant || (primary ? "primary" : "secondary");
  const classes = `${BASE} ${SIZES[size] || SIZES.lg} ${VARIANTS[resolvedVariant] || VARIANTS.primary} ${
    disabled ? "opacity-50 pointer-events-none" : ""
  } ${className}`;

  const content = (
    <motion.span
      whileHover={disabled ? undefined : { scale: 1.05, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.97, y: 0 }}
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
    <button type={type} onClick={onClick} disabled={disabled} className="inline-block" {...rest}>
      {content}
    </button>
  );
}
