/**
 * Shown while Hero3D's chunk is still downloading (Suspense fallback)
 * and permanently in place of it if WebGL/three.js ever fails to
 * initialize (Hero3DErrorBoundary swaps to this). Costs nothing but a
 * couple of blurred, animated divs, so the hero never has an empty
 * gap and never depends on the 3D bundle to look intentional.
 */
export default function Hero3DFallback() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        className="absolute w-[280px] h-[280px] md:w-[380px] md:h-[380px] rounded-full bg-gradient-to-br from-violet-600/40 via-fuchsia-600/30 to-cyan-500/40 blur-[70px] animate-[pulse-glow_4s_ease-in-out_infinite]"
        aria-hidden="true"
      />
      <div
        className="relative w-[180px] h-[180px] md:w-[240px] md:h-[240px] rounded-full border border-white/10 bg-white/5 backdrop-blur-3xl animate-[float-y_6s_ease-in-out_infinite]"
        aria-hidden="true"
      />
    </div>
  );
}
