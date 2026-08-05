const TICK_ANGLES = [0, 60, 120, 180, 240, 300];

/**
 * CareerLens AI's brand icon: an abstract camera-lens/aperture ring
 * (discovery, focus, a "lens" on your career) with a small four-point
 * spark at its center (AI/intelligence). Pure inline SVG, no external
 * image or icon-package dependency, so it can be dropped in anywhere
 * (Navbar, Hero, and later other parts of the app) at any size.
 */
export default function BrandIcon({ size = 40, className = "" }) {
  const inner = Math.round(size * 0.62);

  return (
    <div
      className={`relative shrink-0 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 flex items-center justify-center shadow-[0_8px_25px_rgba(139,92,246,.35)] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 40 40"
        width={inner}
        height={inner}
        fill="none"
        aria-hidden="true"
      >
        {/* Lens ring */}
        <circle cx="20" cy="20" r="11" stroke="white" strokeWidth="2" opacity="0.92" />

        {/* Aperture ticks around the ring */}
        {TICK_ANGLES.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 20 + Math.cos(rad) * 12.5;
          const y1 = 20 + Math.sin(rad) * 12.5;
          const x2 = 20 + Math.cos(rad) * 15;
          const y2 = 20 + Math.sin(rad) * 15;
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.7"
            />
          );
        })}

        {/* AI spark at the center */}
        <path
          d="M20 13 L21.6 18.4 L27 20 L21.6 21.6 L20 27 L18.4 21.6 L13 20 L18.4 18.4 Z"
          fill="white"
        />
      </svg>
    </div>
  );
}
