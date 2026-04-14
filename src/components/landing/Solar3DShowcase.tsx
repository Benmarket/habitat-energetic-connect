import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Preload GLB
useGLTF.preload("/models/solar_panel.glb");

const ROOF_TILT = Math.PI * 0.22;

// ─── Scroll progress hook ───
const useScrollProgress = (containerRef: React.RefObject<HTMLElement>) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const raw = 1 - (rect.bottom - viewH * 0.3) / (rect.height + viewH * 0.3);
      setProgress(Math.max(0, Math.min(1, raw)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [containerRef]);
  return progress;
};

// ─── Solar Panel (GLB model) ───
const SolarPanel = ({ position, delay, progress, index }: {
  position: [number, number, number]; delay: number; progress: number; index: number;
}) => {
  const ref = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/solar_panel.glb");
  const clone = useMemo(() => scene.clone(true), [scene]);

  const t = Math.max(0, Math.min(1, (progress - delay) / 0.1));
  const e = 1 - Math.pow(1 - t, 3);
  const startY = position[1] + 5 + index * 0.2;
  const y = startY + (position[1] - startY) * e;

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.set(position[0], y, position[2]);
    const s = 0.5 + 0.5 * e;
    // Scale: panel model is ~0.29×0.98×0.57, at 1.4 → ~0.41×1.37×0.80
    ref.current.scale.set(s * 1.4, s * 1.4, s * 1.4);
    if (t >= 1) {
      ref.current.position.y += Math.sin(state.clock.elapsedTime * 0.6 + index) * 0.005;
    }
  });

  return (
    <group ref={ref}>
      <group rotation={[0.18, Math.PI / 2, 0]}>
        <group rotation={[0, 0, Math.PI / 2]}>
          <primitive object={clone} />
        </group>
      </group>
    </group>
  );
};

// ─── Roof + Panels ───
const RoofWithPanels = ({ progress }: { progress: number }) => {
  // Steeper tilt so the roof faces the camera/sun more directly
  const TILT = ROOF_TILT; // ~40°
  const animProgress = Math.min(1, progress * 2);

  // 3 rows × 4 cols portrait panels, like the reference image
  const panels = useMemo(() => {
    const items: { pos: [number, number, number]; delay: number }[] = [];
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        items.push({
          pos: [-2.1 + c * 1.4, 0.31, -1.4 + r * 1.5],
          delay: 0.05 + idx * 0.06,
        });
        idx++;
      }
    }
    return items;
  }, []);

  return (
    <group position={[0, 0, -1.5]} rotation={[TILT, 0, 0]}>
      {/* Roof slab */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[7.5, 0.12, 5.2]} />
        <meshStandardMaterial color="#b07848" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Tile rows */}
      {Array.from({ length: 13 }).map((_, i) => (
        <mesh key={i} position={[0, 0.07, -2.4 + i * 0.4]} receiveShadow>
          <boxGeometry args={[7.4, 0.035, 0.28]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#a06838" : "#b87848"} roughness={0.92} />
        </mesh>
      ))}
      {/* Ridge */}
      <mesh position={[0, 0.1, -2.65]} castShadow>
        <boxGeometry args={[7.7, 0.16, 0.18]} />
        <meshStandardMaterial color="#8a5530" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Eave */}
      <mesh position={[0, -0.01, 2.65]} castShadow>
        <boxGeometry args={[7.8, 0.2, 0.16]} />
        <meshStandardMaterial color="#6a4020" roughness={0.8} />
      </mesh>
      {/* Side trims */}
      <mesh position={[3.8, 0.05, 0]}><boxGeometry args={[0.1, 0.14, 5.3]} /><meshStandardMaterial color="#7a4828" roughness={0.85} /></mesh>
      <mesh position={[-3.8, 0.05, 0]}><boxGeometry args={[0.1, 0.14, 5.3]} /><meshStandardMaterial color="#7a4828" roughness={0.85} /></mesh>

      {/* Panels */}
      {panels.map((p, i) => (
        <SolarPanel key={i} position={p.pos} delay={p.delay} progress={animProgress} index={i} />
      ))}
    </group>
  );
};

// ─── Camera ───
const CameraCtrl = ({ progress }: { progress: number }) => {
  const { camera } = useThree();
  useFrame(() => {
    // Camera positioned lower and more in front to see panels face-on
    const angle = -0.15 + progress * 0.2;
    const radius = 10 - progress * 1.5;
    const height = 6 + progress * 1.5;
    camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
    camera.lookAt(0, 0, -1.5);
  });
  return null;
};

// ─── Full Scene ───
const Scene = ({ progress }: { progress: number }) => (
  <>
    <ambientLight intensity={0.35} />
    <directionalLight position={[10, 15, 8]} intensity={2.2} castShadow
      shadow-mapSize-width={2048} shadow-mapSize-height={2048}
      shadow-camera-far={40} shadow-camera-left={-12} shadow-camera-right={12}
      shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.0005}
    />
    <directionalLight position={[-6, 10, -4]} intensity={0.5} color="#ffd4a0" />
    <pointLight position={[0, 8, 0]} intensity={0.3} color="#fff5e0" />
    <Environment preset="sunset" />
    <fog attach="fog" args={["#0a1628", 18, 40]} />
    <CameraCtrl progress={progress} />
    <RoofWithPanels progress={progress} />
    <ContactShadows position={[0, -4.8, 0]} opacity={0.5} scale={25} blur={2.5} far={12} />
  </>
);

// ─── Exported Component ───
const Solar3DShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(containerRef as React.RefObject<HTMLElement>);

  return (
    <section
      ref={containerRef}
      className="relative bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628] overflow-hidden"
      style={{ height: "100vh" }}
    >
      <div className="sticky top-0 h-screen w-full">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center bg-[#0a1628]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
              <div className="text-white/50 text-sm font-medium tracking-wide">Chargement de la scène 3D…</div>
            </div>
          </div>
        }>
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.1,
            }}
            camera={{ position: [9, 6, 9], fov: 35 }}
          >
            <Scene progress={progress} />
          </Canvas>
        </Suspense>

        {/* Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-6 lg:pb-10">
          <div className="container mx-auto px-6 max-w-5xl">
            <div
              className="transition-all duration-700"
              style={{
                opacity: progress > 0.25 ? Math.min(1, (progress - 0.25) / 0.15) : 0,
                transform: `translateY(${progress > 0.25 ? 0 : 40}px)`,
              }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white/80 text-sm font-semibold mb-4 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Installation professionnelle
              </span>
              <h2 className="text-3xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
                Vos panneaux, posés avec
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent"> précision</span>
              </h2>
              <p className="text-white/50 text-base lg:text-lg max-w-xl leading-relaxed">
                Chaque panneau est installé par nos techniciens certifiés RGE
                pour un rendement optimal et une intégration parfaite à votre toiture.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-1.5 w-56 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.min(1, progress * 2) * 105)}%` }}
                />
              </div>
              <span className="text-white/30 text-sm font-mono tracking-wider">
                {Math.min(12, Math.floor(Math.min(1, progress * 2) * 13))}/12 panneaux
              </span>
            </div>
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>
    </section>
  );
};

export default Solar3DShowcase;
