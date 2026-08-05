import { useEffect, useRef } from "react";

/**
 * Lightweight, always-on animated backdrop for the whole landing page:
 * slow-drifting aurora blobs (pure CSS, GPU-cheap transforms only),
 * a faint panning grid, and a sparse canvas particle field. Everything
 * moves slowly and never competes with foreground content for
 * attention, per the "never distract the user" brief.
 *
 * Mounted once in Landing.jsx as a fixed, full-viewport, -z-10 layer
 * so every section shares one continuous background instead of each
 * section re-implementing its own blobs (which is what the old
 * Hero.jsx/Features.jsx did independently).
 */
export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050816]">
      {/* Aurora blobs */}
      <div
        className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-700/25 blur-[160px] animate-[aurora-drift-1_24s_ease-in-out_infinite]"
        style={{ willChange: "transform" }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[650px] h-[650px] rounded-full bg-cyan-600/20 blur-[180px] animate-[aurora-drift-2_28s_ease-in-out_infinite]"
        style={{ willChange: "transform" }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full bg-fuchsia-600/15 blur-[170px] animate-[aurora-drift-3_18s_ease-in-out_infinite]"
        style={{ willChange: "transform, opacity" }}
      />

      {/* Faint slowly-panning grid */}
      <div
        className="absolute inset-0 opacity-[0.05] animate-[grid-pan_20s_linear_infinite]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Sparse drifting particles */}
      <ParticleField />

      {/* Gentle vignette so content near the edges stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#050816_95%)]" />
    </div>
  );
}

function ParticleField() {
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
        ctx.fillStyle = `rgba(196, 181, 253, ${p.alpha})`;
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
        ctx.fillStyle = `rgba(196, 181, 253, ${p.alpha})`;
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-60"
      aria-hidden="true"
    />
  );
}
