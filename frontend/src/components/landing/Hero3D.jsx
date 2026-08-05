import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

/**
 * The interactive 3D hero visual. Deliberately avoids anything that
 * needs a network fetch at runtime (no HDRI environment maps, no
 * GLTF models, no postprocessing package) - everything here is
 * procedural geometry and material, so it works offline and has one
 * fewer way to fail. "Bloom"-style glow comes from emissive materials
 * plus the CSS glow layered behind the canvas in Hero.jsx, not a
 * postprocessing pass.
 *
 * Lazy-loaded from Hero.jsx via React.lazy + Suspense, and wrapped in
 * Hero3DErrorBoundary there, so this never blocks or breaks the rest
 * of the landing page.
 */
export default function Hero3D() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 3, 4]} intensity={40} color="#a78bfa" />
      <pointLight position={[-4, -2, -3]} intensity={30} color="#22d3ee" />
      <pointLight position={[0, -3, 3]} intensity={18} color="#e879f9" />

      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}

function Scene() {
  const groupRef = useRef(null);
  const coreRef = useRef(null);
  const target = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    // Slow constant autorotation.
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.15;
      coreRef.current.rotation.x += delta * 0.05;
    }

    // Gentle mouse-follow tilt - lerped so it never snaps, and capped
    // to a small range so it stays subtle rather than gimmicky.
    target.current.x = state.pointer.y * 0.25;
    target.current.y = state.pointer.x * 0.35;

    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        target.current.x,
        0.04
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        target.current.y,
        0.04
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central glass-like distorted core */}
      <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.8}>
        <Sphere ref={coreRef} args={[1.5, 96, 96]}>
          <MeshDistortMaterial
            color="#7c3aed"
            emissive="#4c1d95"
            emissiveIntensity={0.4}
            roughness={0.15}
            metalness={0.6}
            distort={0.35}
            speed={1.6}
            transparent
            opacity={0.92}
          />
        </Sphere>
      </Float>

      {/* Orbiting accent nodes - a light "network" motif */}
      {ORBIT_NODES.map((node, i) => (
        <OrbitNode key={i} {...node} />
      ))}
    </group>
  );
}

const ORBIT_NODES = [
  { radius: 2.6, speed: 0.35, offset: 0, height: 0.4, size: 0.14, color: "#22d3ee" },
  { radius: 2.9, speed: -0.28, offset: 2.1, height: -0.6, size: 0.1, color: "#e879f9" },
  { radius: 2.3, speed: 0.22, offset: 4.2, height: 0.9, size: 0.12, color: "#a78bfa" },
  { radius: 3.2, speed: -0.18, offset: 1.2, height: -0.2, size: 0.08, color: "#67e8f9" },
];

function OrbitNode({ radius, speed, offset, height, size, color }) {
  const ref = useRef(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed + offset;
    if (ref.current) {
      ref.current.position.set(Math.cos(t) * radius, height + Math.sin(t * 0.8) * 0.3, Math.sin(t) * radius);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 24, 24]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} roughness={0.3} />
    </mesh>
  );
}
