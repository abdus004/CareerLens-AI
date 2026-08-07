import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { FileText, BarChart3, Compass, Map, MessageSquare, Briefcase, Award } from "lucide-react";

import BrandIcon from "../BrandIcon";
import { useTheme } from "../../context/ThemeContext";

const NODES = [
  { key: "resume", label: "Resume", icon: FileText, color: "#a78bfa" },
  { key: "skills", label: "Skills", icon: BarChart3, color: "#22d3ee" },
  { key: "career", label: "Career", icon: Compass, color: "#e879f9" },
  { key: "learning", label: "Learning", icon: Map, color: "#67e8f9" },
  { key: "interview", label: "Interview", icon: MessageSquare, color: "#c084fc" },
  { key: "jobs", label: "Jobs", icon: Briefcase, color: "#38bdf8" },
  { key: "certificates", label: "Certificates", icon: Award, color: "#f0abfc" },
];

// Positions are precomputed once (angles are static) as percentages of
// the container, so both the HTML node badges and the SVG connection
// lines below can share the exact same 0-100 coordinate space and
// always line up, regardless of the container's actual pixel size.
const RADIUS = 38;
const NODE_POSITIONS = NODES.map((node, i) => {
  const angle = (-90 + i * (360 / NODES.length)) * (Math.PI / 180);
  return {
    ...node,
    x: 50 + Math.cos(angle) * RADIUS,
    y: 50 + Math.sin(angle) * RADIUS,
  };
});

/**
 * The CareerLens AI ecosystem visual: a central brand node connected
 * to the platform's core capabilities. Replaces the old generic 3D
 * blob with something that actually represents the product -
 * User -> CareerLens AI -> Resume / Skills / Career -> Learning /
 * Interview / Jobs -> Certificates - expressed as glowing connected
 * nodes rather than a literal diagram.
 *
 * The center node itself is dressed as a glowing holographic
 * sphere / glass crystal - two tilted rings spinning at different
 * speeds around the brand mark (pure CSS 3D transforms) plus a
 * drifting glass-refraction sheen - so it still reads as a floating
 * 3D AI object, not a flat badge, in either theme.
 *
 * Pure CSS/SVG/React - no three.js or any 3D library, so it's light,
 * has nothing that can fail to load, and needs no lazy-loading or
 * error boundary the way the old WebGL hero did.
 */
export default function CareerLensNetwork() {
  const containerRef = useRef(null);
  const { theme } = useTheme();
  const isLight = theme === "light";

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 60, damping: 18, mass: 0.6 });
  const springY = useSpring(pointerY, { stiffness: 60, damping: 18, mass: 0.6 });

  const handlePointerMove = (event) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(relX * 18);
    pointerY.set(relY * 18);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      className="relative w-full h-full select-none"
    >
      {/* Ambient background glow - moves slightly less than the
          foreground nodes for a subtle sense of depth. Boosted
          opacity in light mode so it still registers against a
          near-white page instead of washing out. */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute inset-0"
      >
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] rounded-full blur-[80px] bg-gradient-to-br ${
            isLight
              ? "from-violet-500/30 via-fuchsia-500/18 to-cyan-500/30"
              : "from-violet-600/20 via-fuchsia-600/10 to-cyan-500/20"
          }`}
        />
      </motion.div>

      {/* Soft grounding shadow beneath the orb - on a light page a
          floating object needs a shadow underneath to actually read
          as floating; on a dark page the glow alone does that job. */}
      {isLight && (
        <div className="absolute top-[58%] left-1/2 -translate-x-1/2 w-40 h-8 rounded-full bg-violet-900/10 blur-2xl" />
      )}

      {/* Connection lines */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="clNetworkLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {NODE_POSITIONS.map((node) => (
          <line
            key={node.key}
            x1="50"
            y1="50"
            x2={node.x}
            y2={node.y}
            stroke="url(#clNetworkLine)"
            strokeWidth="0.35"
            strokeDasharray="2 3"
            className="animate-[dash-flow_3.5s_linear_infinite]"
          />
        ))}
      </svg>

      {/* Foreground: center brand node + orbiting capability nodes */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute inset-0"
      >
        {/* Center node */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3"
        >
          <div
            className="absolute inset-0 m-auto w-28 h-28 rounded-full bg-gradient-to-br from-violet-500/50 to-cyan-400/50 blur-2xl animate-[pulse-glow_4s_ease-in-out_infinite]"
            aria-hidden="true"
          />

          {/* Holographic sphere rings - two ellipses (rotateX tilts a
              circle into an ellipse) spinning at different speeds in
              opposite directions around the brand mark. Also gently
              bobs up and down so the whole orb reads as floating. */}
          <div
            className="absolute inset-0 m-auto w-32 h-32 animate-[orb-float_5s_ease-in-out_infinite]"
            style={{ perspective: "600px" }}
            aria-hidden="true"
          >
            <div
              className={`absolute inset-0 rounded-full animate-[orb-ring-spin-a_14s_linear_infinite] border ${
                isLight ? "border-violet-500/45" : "border-violet-300/30"
              }`}
            />
            <div
              className={`absolute inset-3 rounded-full animate-[orb-ring-spin-b_20s_linear_infinite] border ${
                isLight ? "border-cyan-500/40" : "border-cyan-300/25"
              }`}
            />
          </div>

          {/* Glass-crystal refraction sheen drifting across the mark */}
          <div
            className="absolute inset-0 m-auto w-20 h-20 rounded-full overflow-hidden pointer-events-none"
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 animate-[shine-sweep_5s_ease-in-out_infinite]"
              style={{
                backgroundImage:
                  "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.65) 48%, transparent 66%)",
                backgroundSize: "250% 100%",
                mixBlendMode: "overlay",
              }}
            />
          </div>

          <BrandIcon size={76} className="relative z-10" />
          <span className="relative z-10 text-xs font-semibold tracking-wide text-white/90 bg-white/5 border border-white/10 backdrop-blur-xl px-3 py-1 rounded-full whitespace-nowrap">
            CareerLens AI
          </span>
        </motion.div>

        {/* Capability nodes */}
        {NODE_POSITIONS.map((node, index) => {
          const Icon = node.icon;
          return (
            <motion.div
              key={node.key}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 3.4 + (index % 3) * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.25,
                }}
                className="relative"
              >
                <div
                  className="absolute inset-0 m-auto w-11 h-11 rounded-2xl blur-xl opacity-60"
                  style={{ backgroundColor: node.color }}
                  aria-hidden="true"
                />
                <div
                  className="relative w-11 h-11 rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-xl flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,.25)]"
                  style={{ boxShadow: `0 0 22px ${node.color}33` }}
                >
                  <Icon size={18} style={{ color: node.color }} />
                </div>
              </motion.div>
              <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                {node.label}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
