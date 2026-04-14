import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/models/solar_panel.glb");

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

// ─── Debug config type ───
interface DebugConfig {
  roofPosX: number; roofPosY: number; roofPosZ: number;
  roofRotX: number; roofRotY: number; roofRotZ: number;
  panelRotAX: number; panelRotAY: number; panelRotAZ: number;
  panelRotBX: number; panelRotBY: number; panelRotBZ: number;
  panelY: number;
  panelScale: number;
}

const DEFAULT_CONFIG: DebugConfig = {
  roofPosX: 0, roofPosY: 0, roofPosZ: -1.5,
  roofRotX: 0.69, roofRotY: 0, roofRotZ: 0, // 0.69 ≈ PI*0.22
  panelRotAX: 0, panelRotAY: 1.5708, panelRotAZ: 0, // PI/2
  panelRotBX: 2.68, panelRotBY: 0, panelRotBZ: 1.5708, // PI/2
  panelY: 0.31,
  panelScale: 1.4,
};

const getPanelBaseEuler = (config: DebugConfig) => {
  const rotA = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(config.panelRotAX, config.panelRotAY, config.panelRotAZ, "XYZ")
  );
  const rotB = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(config.panelRotBX, config.panelRotBY, config.panelRotBZ, "XYZ")
  );
  const combined = rotA.multiply(rotB);
  const baseEuler = new THREE.Euler().setFromQuaternion(combined, "XYZ");

  return [
    +baseEuler.x.toFixed(4),
    +baseEuler.y.toFixed(4),
    +baseEuler.z.toFixed(4),
  ] as [number, number, number];
};

// ─── Solar Panel (GLB model) ───
const SolarPanel = ({ position, delay, progress, index, config }: {
  position: [number, number, number]; delay: number; progress: number; index: number;
  config: DebugConfig;
}) => {
  const ref = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/solar_panel.glb");
  const clone = useMemo(() => {
    const c = scene.clone(true);
    // Reset all transforms on the clone so our rotations are the only ones applied
    c.position.set(0, 0, 0);
    c.rotation.set(0, 0, 0);
    c.scale.set(1, 1, 1);
    c.traverse((child) => {
      child.position.set(0, 0, 0);
      child.rotation.set(0, 0, 0);
      child.scale.set(1, 1, 1);
    });
    return c;
  }, [scene]);
  const panelBaseEuler = useMemo(
    () => getPanelBaseEuler(config),
    [
      config.panelRotAX,
      config.panelRotAY,
      config.panelRotAZ,
      config.panelRotBX,
      config.panelRotBY,
      config.panelRotBZ,
    ]
  );

  const t = Math.max(0, Math.min(1, (progress - delay) / 0.1));
  const e = 1 - Math.pow(1 - t, 3);
  const startY = position[1] + 5 + index * 0.2;
  const y = startY + (position[1] - startY) * e;

  useEffect(() => {
    if (!panelRef.current) return;
    panelRef.current.rotation.set(...panelBaseEuler);
  }, [panelBaseEuler]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.set(position[0], y, position[2]);
    const s = 0.5 + 0.5 * e;
    ref.current.scale.set(s * config.panelScale, s * config.panelScale, s * config.panelScale);
    if (t >= 1) {
      ref.current.position.y += Math.sin(state.clock.elapsedTime * 0.6 + index) * 0.005;
    }
  });

  return (
    <group ref={ref}>
      <group ref={panelRef}>
        <primitive object={clone} />
      </group>
    </group>
  );
};

// ─── Roof + Panels ───
const RoofWithPanels = ({ progress, config }: { progress: number; config: DebugConfig }) => {
  const animProgress = Math.min(1, progress * 2);

  const panels = useMemo(() => {
    const items: { pos: [number, number, number]; delay: number }[] = [];
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 6; c++) {
        items.push({
          pos: [-2.5 + c * 0.95, config.panelY, -1.4 + r * 1.5],
          delay: 0.05 + idx * 0.035,
        });
        idx++;
      }
    }
    return items;
  }, [config.panelY]);

  return (
    <group
      position={[config.roofPosX, config.roofPosY, config.roofPosZ]}
      rotation={[config.roofRotX, config.roofRotY, config.roofRotZ]}
    >
      <mesh receiveShadow castShadow>
        <boxGeometry args={[7.5, 0.12, 5.2]} />
        <meshStandardMaterial color="#b07848" roughness={0.85} metalness={0.05} />
      </mesh>
      {Array.from({ length: 13 }).map((_, i) => (
        <mesh key={i} position={[0, 0.07, -2.4 + i * 0.4]} receiveShadow>
          <boxGeometry args={[7.4, 0.035, 0.28]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#a06838" : "#b87848"} roughness={0.92} />
        </mesh>
      ))}
      <mesh position={[0, 0.1, -2.65]} castShadow>
        <boxGeometry args={[7.7, 0.16, 0.18]} />
        <meshStandardMaterial color="#8a5530" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.01, 2.65]} castShadow>
        <boxGeometry args={[7.8, 0.2, 0.16]} />
        <meshStandardMaterial color="#6a4020" roughness={0.8} />
      </mesh>
      <mesh position={[3.8, 0.05, 0]}><boxGeometry args={[0.1, 0.14, 5.3]} /><meshStandardMaterial color="#7a4828" roughness={0.85} /></mesh>
      <mesh position={[-3.8, 0.05, 0]}><boxGeometry args={[0.1, 0.14, 5.3]} /><meshStandardMaterial color="#7a4828" roughness={0.85} /></mesh>

      {panels.map((p, i) => (
        <SolarPanel key={i} position={p.pos} delay={p.delay} progress={animProgress} index={i} config={config} />
      ))}
    </group>
  );
};

// ─── Camera ───
const CameraCtrl = ({ progress }: { progress: number }) => {
  const { camera } = useThree();
  useFrame(() => {
    const angle = -0.15 + progress * 0.2;
    const radius = 10 - progress * 1.5;
    const height = 6 + progress * 1.5;
    camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
    camera.lookAt(0, 0, -1.5);
  });
  return null;
};

// ─── Camera tracker ───
const CameraTracker = ({ onUpdate }: { onUpdate: (pos: [number, number, number], rot: [number, number, number]) => void }) => {
  const { camera } = useThree();
  useFrame(() => {
    onUpdate(
      [+camera.position.x.toFixed(2), +camera.position.y.toFixed(2), +camera.position.z.toFixed(2)],
      [+camera.rotation.x.toFixed(3), +camera.rotation.y.toFixed(3), +camera.rotation.z.toFixed(3)]
    );
  });
  return null;
};

// ─── Full Scene ───
const Scene = ({ progress, config, onCameraUpdate }: { progress: number; config: DebugConfig; onCameraUpdate: (pos: [number, number, number], rot: [number, number, number]) => void }) => (
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
    <OrbitControls target={[0, 0, -1.5]} enableZoom={false} />
    <CameraTracker onUpdate={onCameraUpdate} />
    {/* <CameraCtrl progress={progress} /> */}
    <RoofWithPanels progress={progress} config={config} />
    <ContactShadows position={[0, -4.8, 0]} opacity={0.5} scale={25} blur={2.5} far={12} />
  </>
);

// ─── Debug Panel ───
const DebugPanel = ({ config, onChange, camPos, camRot }: {
  config: DebugConfig; onChange: (c: DebugConfig) => void;
  camPos: [number, number, number]; camRot: [number, number, number];
}) => {
  const panelBaseEuler = useMemo(() => getPanelBaseEuler(config), [config]);
  const fields: { key: keyof DebugConfig; label: string; step: number; min: number; max: number }[] = [
    { key: "roofPosX", label: "Toit Pos X", step: 0.1, min: -5, max: 5 },
    { key: "roofPosY", label: "Toit Pos Y", step: 0.1, min: -5, max: 5 },
    { key: "roofPosZ", label: "Toit Pos Z", step: 0.1, min: -10, max: 5 },
    { key: "roofRotX", label: "Toit Rot X", step: 0.01, min: -3.15, max: 3.15 },
    { key: "roofRotY", label: "Toit Rot Y", step: 0.01, min: -3.15, max: 3.15 },
    { key: "roofRotZ", label: "Toit Rot Z", step: 0.01, min: -3.15, max: 3.15 },
    { key: "panelRotAX", label: "Panel RotA X", step: 0.01, min: -3.15, max: 3.15 },
    { key: "panelRotAY", label: "Panel RotA Y", step: 0.01, min: -3.15, max: 3.15 },
    { key: "panelRotAZ", label: "Panel RotA Z", step: 0.01, min: -3.15, max: 3.15 },
    { key: "panelRotBX", label: "Panel RotB X", step: 0.01, min: -3.15, max: 3.15 },
    { key: "panelRotBY", label: "Panel RotB Y", step: 0.01, min: -3.15, max: 3.15 },
    { key: "panelRotBZ", label: "Panel RotB Z", step: 0.01, min: -3.15, max: 3.15 },
    { key: "panelY", label: "Panel Hauteur", step: 0.01, min: -1, max: 2 },
    { key: "panelScale", label: "Panel Scale", step: 0.05, min: 0.5, max: 3 },
  ];

  return (
    <div className="absolute top-16 right-4 z-50 bg-black/80 backdrop-blur-md rounded-xl p-4 text-white text-xs font-mono w-64 max-h-[80vh] overflow-y-auto border border-white/20">
      <div className="text-emerald-400 font-bold text-sm mb-3">🔧 Debug 3D</div>

      {/* Camera live values */}
      <div className="mb-3 p-2 rounded bg-blue-500/10 border border-blue-400/20">
        <div className="text-blue-300 font-bold mb-1">📷 Caméra (live)</div>
        <div className="text-white/60">Pos: {camPos[0]}, {camPos[1]}, {camPos[2]}</div>
        <div className="text-white/60">Rot: {camRot[0]}, {camRot[1]}, {camRot[2]}</div>
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify({ camPos, camRot }, null, 2))}
          className="mt-1 w-full bg-blue-500/20 hover:bg-blue-500/30 rounded py-1 text-blue-300 text-xs transition-colors"
        >
          Copier caméra
        </button>
      </div>

      <div className="mb-3 p-2 rounded bg-emerald-500/10 border border-emerald-400/20">
        <div className="text-emerald-300 font-bold mb-1">🧭 Rotation panneau de base</div>
        <div className="text-white/60">X: {panelBaseEuler[0]}</div>
        <div className="text-white/60">Y: {panelBaseEuler[1]}</div>
        <div className="text-white/60">Z: {panelBaseEuler[2]}</div>
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify({ panelBaseEuler }, null, 2))}
          className="mt-1 w-full bg-emerald-500/20 hover:bg-emerald-500/30 rounded py-1 text-emerald-300 text-xs transition-colors"
        >
          Copier rotation de base
        </button>
      </div>

      {fields.map(f => (
        <div key={f.key} className="flex items-center gap-2 mb-1.5">
          <label className="w-24 text-white/60 shrink-0">{f.label}</label>
          <input
            type="number"
            step={f.step}
            min={f.min}
            max={f.max}
            value={config[f.key]}
            onChange={e => onChange({ ...config, [f.key]: parseFloat(e.target.value) || 0 })}
            className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
          />
        </div>
      ))}
      <button
        onClick={() => onChange({ ...DEFAULT_CONFIG })}
        className="mt-3 w-full bg-white/10 hover:bg-white/20 rounded py-1.5 text-white/80 text-xs transition-colors"
      >
        Reset
      </button>
      <button
        onClick={() => navigator.clipboard.writeText(JSON.stringify(config, null, 2))}
        className="mt-1 w-full bg-emerald-500/20 hover:bg-emerald-500/30 rounded py-1.5 text-emerald-300 text-xs transition-colors"
      >
        Copier les valeurs
      </button>
    </div>
  );
};

// ─── Exported Component ───
const Solar3DShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(containerRef as React.RefObject<HTMLElement>);
  const [config, setConfig] = useState<DebugConfig>(() => {
    try {
      const saved = localStorage.getItem("solar3d_debug");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CONFIG;
  });
  const handleConfigChange = (c: DebugConfig) => {
    setConfig(c);
    localStorage.setItem("solar3d_debug", JSON.stringify(c));
  };
  const camPosRef = useRef<[number, number, number]>([9, 6, 9]);
  const camRotRef = useRef<[number, number, number]>([0, 0, 0]);
  const [camDisplay, setCamDisplay] = useState<{ pos: [number, number, number]; rot: [number, number, number] }>({
    pos: [9, 6, 9], rot: [0, 0, 0]
  });
  const handleCameraUpdate = (pos: [number, number, number], rot: [number, number, number]) => {
    camPosRef.current = pos;
    camRotRef.current = rot;
  };

  // Throttle camera display updates to avoid re-rendering every frame
  useEffect(() => {
    const interval = setInterval(() => {
      setCamDisplay({ pos: camPosRef.current, rot: camRotRef.current });
    }, 200);
    return () => clearInterval(interval);
  }, []);

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
            camera={{ position: [-8.16, 7.8, 10.62], fov: 35 }}
          >
            <Scene progress={progress} config={config} onCameraUpdate={handleCameraUpdate} />
          </Canvas>
        </Suspense>

        {/* Debug Panel */}
        <DebugPanel config={config} onChange={handleConfigChange} camPos={camDisplay.pos} camRot={camDisplay.rot} />

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
