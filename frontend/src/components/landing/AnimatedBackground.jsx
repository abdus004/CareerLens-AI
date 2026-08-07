import { useEffect, useRef } from "react";

import { useTheme } from "../../context/ThemeContext";

/**
 * Lightweight, always-on animated backdrop for the whole landing page:
 * slow-drifting aurora blobs (pure CSS, GPU-cheap transforms only),
 * a faint panning grid, a sparse canvas particle field, and (light
 * mode only) a soft drifting glass reflection. Everything moves
 * slowly and never competes with foreground content for attention,
 * per the "never distract the user" brief.
 *
 * Mounted once in Landing.jsx as a fixed, full-viewport, -z-10 layer
 * so every section shares one continuous background instead of each
 * section re-implementing its own blobs.
 *
 * Reads ThemeContext directly so the exact same futuristic depth -
 * blobs, grid, particles, vignette - survives the light/dark switch
 * instead of just going flat white. The dark-mode branch below is
 * unchanged from before; only the light-mode values are new.
 */
export default function AnimatedBackground() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: isLight ? "#f6f4fd" : "#050816" }}
    >
      {/* Aurora blobs - richer/more saturated in light mode so they
          still read clearly against a near-white base instead of
          washing out. */}
      <div
        className={`absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[160px] animate-[aurora-drift-1_24s_ease-in-out_infinite] ${
          isLight ? "bg-violet-400/35" : "bg-violet-700/25"
        }`}
        style={{ willChange: "transform" }}
      />
      <div
        className={`absolute bottom-[-20%] right-[-10%] w-[650px] h-[650px] rounded-full blur-[180px] animate-[aurora-drift-2_28s_ease-in-out_infinite] ${
          isLight ? "bg-cyan-400/30" : "bg-cyan-600/20"
        }`}
        style={{ willChange: "transform" }}
      />
      <div
        className={`absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full blur-[170px] animate-[aurora-drift-3_18s_ease-in-out_infinite] ${
          isLight ? "bg-fuchsia-400/20" : "bg-fuchsia-600/15"
        }`}
        style={{ willChange: "transform, opacity" }}
      />

      {/* Faint slowly-panning grid. Dark mode uses white lines on a
          dark base; light mode needs dark-tinted lines on a light
          base instead, or the grid is simply invisible. */}
      <div
        className="absolute inset-0 animate-[grid-pan_20s_linear_infinite]"
        style={{
          opacity: isLight ? 0.06 : 0.05,
          backgroundImage: isLight
            ? "linear-gradient(rgba(91,61,173,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(91,61,173,.5) 1px, transparent 1px)"
            : "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Light mode only: a soft diagonal glass reflection drifting
          across the page - the "moving light reflections" a truly
          premium light surface needs, since it has no dark backdrop
          to generate its own sense of glow/depth. */}
      {isLight && (
        <div
          className="absolute -inset-1/4 opacity-50 animate-[reflection-drift_16s_ease-in-out_infinite]"
          style={{
            background:
              "linear-gradient(115deg, transparent 35%, rgba(255,255,255,.9) 48%, rgba(124,58,237,.12) 52%, transparent 65%)",
            mixBlendMode: "soft-light",
          }}
        />
      )}

      {/* Sparse drifting particles */}
      <ParticleField isLight={isLight} />

      {/* Gentle vignette so content near the edges stays readable */}
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? "radial-gradient(ellipse at center, transparent 40%, #f6f4fd 96%)"
            : "radial-gradient(ellipse at center, transparent 40%, #050816 95%)",
        }}
      />
    </div>
  );
}

function ParticleField({ isLight }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationFrameId = null;
    let particles = [];

    const PARTICLE_COUNT = 55;
    // Light violet on a dark sky; a deeper, more saturated violet on
    // a white/lavender page so particles stay visible at the same
    // gentle alpha instead of disappearing into the light background.
    const particleRGB = isLight ? "124, 58, 237" : "196, 181, 253";

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.4,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        alpha: Math.random() * 0.5 + 0.15,
      }));
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleRGB}, ${p.alpha})`;
        ctx.fill();
      });
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleRGB}, ${p.alpha})`;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(tick);
    }

    function handleVisibility() {
      if (document.hidden && animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      } else if (!document.hidden && !prefersReducedMotion && !animationFrameId) {
        animationFrameId = requestAnimationFrame(tick);
      }
    }

    resize();
    initParticles();

    if (prefersReducedMotion) {
      drawStatic();
    } else {
      animationFrameId = requestAnimationFrame(tick);
    }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // Re-init (cheap - 55 points) whenever the theme flips so particle
    // color stays correct for the active background.
  }, [isLight]);

  return (
    <canvas
      ref={canvasRef}
      className={isLight ? "absolute inset-0 w-full h-full opacity-70" : "absolute inset-0 w-full h-full opacity-60"}
      aria-hidden="true"
    />
  );
}
