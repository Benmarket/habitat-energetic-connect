import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/models/solar_panel.glb");
useGLTF.preload("/models/solar_panel_flat.glb");

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
  roofPosX: 0.05, roofPosY: -1, roofPosZ: -1.5,
  roofRotX: 0.69, roofRotY: 0, roofRotZ: 0,
  panelRotAX: 0, panelRotAY: 1.5708, panelRotAZ: 0,
  panelRotBX: 2.68, panelRotBY: 0, panelRotBZ: 1.5708,
  panelY: 0.21,
  panelScale: 0.7,
};

const DEFAULT_FLAT_CONFIG: DebugConfig = {
  roofPosX: 0.05, roofPosY: -1.2, roofPosZ: -1.5,
  roofRotX: 0.15, roofRotY: 0, roofRotZ: 0,
  panelRotAX: 0.03, panelRotAY: 1, panelRotAZ: -1.76,
  panelRotBX: 2.6, panelRotBY: 0.11, panelRotBZ: 1.41,
  panelY: 0.55,
  panelScale: 1.05,
};

const DEFAULT_TOLE_CONFIG: DebugConfig = {
  ...DEFAULT_CONFIG,
  roofPosY: -1.1,
  panelY: 0.07,
  panelScale: 0.7,
};

const STORAGE_KEY_TUILES = "solar3d_debug_tuiles";
const STORAGE_KEY_TOLE = "solar3d_debug_tole";
const STORAGE_KEY_FLAT = "solar3d_debug_flat";

const loadConfig = (key: string, defaults: DebugConfig): DebugConfig => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch {}
  return defaults;
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
const SolarPanel = ({ position, delay, progress, index, config, roofType = "tuiles" }: {
  position: [number, number, number]; delay: number; progress: number; index: number;
  config: DebugConfig; roofType?: RoofType;
}) => {
  const ref = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Group>(null);
  const modelPath = roofType === "plate" ? "/models/solar_panel_flat.glb" : "/models/solar_panel.glb";
  const { scene } = useGLTF(modelPath);
  const clone = useMemo(() => {
    const c = scene.clone(true);
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

  // Le config passé correspond déjà au roofType actif (standard ou flat)
  const pRotAX = config.panelRotAX;
  const pRotAY = config.panelRotAY;
  const pRotAZ = config.panelRotAZ;
  const pRotBX = config.panelRotBX;
  const pRotBY = config.panelRotBY;
  const pRotBZ = config.panelRotBZ;
  const pScale = config.panelScale;

  const panelBaseEuler = useMemo(() => {
    const rotA = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(pRotAX, pRotAY, pRotAZ, "XYZ")
    );
    const rotB = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(pRotBX, pRotBY, pRotBZ, "XYZ")
    );
    const combined = rotA.multiply(rotB);
    const baseEuler = new THREE.Euler().setFromQuaternion(combined, "XYZ");
    return [
      +baseEuler.x.toFixed(4),
      +baseEuler.y.toFixed(4),
      +baseEuler.z.toFixed(4),
    ] as [number, number, number];
  }, [pRotAX, pRotAY, pRotAZ, pRotBX, pRotBY, pRotBZ]);

  const t = Math.max(0, Math.min(1, (progress - delay) / 0.1));
  const e = 1 - Math.pow(1 - t, 3);
  const startY = position[1] + 12 + index * 0.3;
  const y = startY + (position[1] - startY) * e;

  useEffect(() => {
    if (!panelRef.current) return;
    panelRef.current.rotation.set(...panelBaseEuler);
  }, [panelBaseEuler]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.set(position[0], y, position[2]);
    const s = 0.5 + 0.5 * e;
    ref.current.scale.set(s * pScale, s * pScale, s * pScale);
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

// ─── Roof types ───
type RoofType = "tuiles" | "tole" | "plate";

// ─── Tuiles Roof ───
const RoofTuiles = () => (
  <>
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
  </>
);

// ─── Tôle blanche Roof ───
const RoofTole = () => (
  <>
    <mesh receiveShadow castShadow>
      <boxGeometry args={[7.5, 0.08, 5.2]} />
      <meshStandardMaterial color="#e8e8ec" roughness={0.3} metalness={0.7} />
    </mesh>
    {/* Metal ridges / ondulations */}
    {Array.from({ length: 20 }).map((_, i) => (
      <mesh key={i} position={[0, 0.06, -2.5 + i * 0.26]} receiveShadow>
        <boxGeometry args={[7.4, 0.025, 0.08]} />
        <meshStandardMaterial color="#d0d0d8" roughness={0.25} metalness={0.8} />
      </mesh>
    ))}
    {/* Edge trim */}
    <mesh position={[0, 0.06, -2.65]} castShadow>
      <boxGeometry args={[7.7, 0.1, 0.12]} />
      <meshStandardMaterial color="#b0b0b8" roughness={0.3} metalness={0.75} />
    </mesh>
    <mesh position={[0, 0, 2.65]} castShadow>
      <boxGeometry args={[7.8, 0.12, 0.1]} />
      <meshStandardMaterial color="#a0a0a8" roughness={0.3} metalness={0.75} />
    </mesh>
    <mesh position={[3.8, 0.03, 0]}><boxGeometry args={[0.08, 0.1, 5.3]} /><meshStandardMaterial color="#b8b8c0" roughness={0.3} metalness={0.7} /></mesh>
    <mesh position={[-3.8, 0.03, 0]}><boxGeometry args={[0.08, 0.1, 5.3]} /><meshStandardMaterial color="#b8b8c0" roughness={0.3} metalness={0.7} /></mesh>
  </>
);

// ─── Toiture Plate ───
const RoofPlate = () => (
  <>
    <mesh receiveShadow castShadow>
      <boxGeometry args={[7.5, 0.18, 5.2]} />
      <meshStandardMaterial color="#c8c0b8" roughness={0.9} metalness={0.02} />
    </mesh>
    {/* Membrane texture lines */}
    {Array.from({ length: 7 }).map((_, i) => (
      <mesh key={i} position={[0, 0.1, -2.2 + i * 0.72]} receiveShadow>
        <boxGeometry args={[7.4, 0.005, 0.04]} />
        <meshStandardMaterial color="#b0a898" roughness={0.95} metalness={0.0} />
      </mesh>
    ))}
    {/* Parapet walls */}
    <mesh position={[0, 0.18, -2.65]} castShadow>
      <boxGeometry args={[7.7, 0.25, 0.12]} />
      <meshStandardMaterial color="#9a9288" roughness={0.85} metalness={0.05} />
    </mesh>
    <mesh position={[0, 0.18, 2.65]} castShadow>
      <boxGeometry args={[7.8, 0.25, 0.12]} />
      <meshStandardMaterial color="#9a9288" roughness={0.85} metalness={0.05} />
    </mesh>
    <mesh position={[3.8, 0.18, 0]}><boxGeometry args={[0.12, 0.25, 5.3]} /><meshStandardMaterial color="#9a9288" roughness={0.85} metalness={0.05} /></mesh>
    <mesh position={[-3.8, 0.18, 0]}><boxGeometry args={[0.12, 0.25, 5.3]} /><meshStandardMaterial color="#9a9288" roughness={0.85} metalness={0.05} /></mesh>
  </>
);

// ─── Roof + Panels ───
const RoofWithPanels = ({ progress, config, roofType }: { progress: number; config: DebugConfig; roofType: RoofType }) => {
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
      {roofType === "tuiles" && <RoofTuiles />}
      {roofType === "tole" && <RoofTole />}
      {roofType === "plate" && <RoofPlate />}

      {panels.map((p, i) => (
        <SolarPanel key={`${roofType}-${i}`} position={p.pos} delay={p.delay} progress={animProgress} index={i} config={config} roofType={roofType} />
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
const Scene = ({ progress, config, roofType, onCameraUpdate }: { progress: number; config: DebugConfig; roofType: RoofType; onCameraUpdate: (pos: [number, number, number], rot: [number, number, number]) => void }) => (
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
    <RoofWithPanels progress={progress} config={config} roofType={roofType} />
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

// ─── Roof Type Selector ───
const ROOF_OPTIONS: { type: RoofType; label: string }[] = [
  { type: "tuiles", label: "Tuiles" },
  { type: "tole", label: "Tôle" },
  { type: "plate", label: "Plate" },
];

const RoofTypeSelector = ({ selected, onSelect }: { selected: RoofType; onSelect: (t: RoofType) => void }) => (
  <div className="absolute left-4 lg:left-8 top-[28%] z-40 flex flex-col gap-1.5">
    <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-1 pl-1">Type de toiture</span>
    {ROOF_OPTIONS.map(opt => {
      const isActive = selected === opt.type;
      return (
        <button
          key={opt.type}
          onClick={() => onSelect(opt.type)}
          className={`
            relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium
            border transition-all duration-200 cursor-pointer min-w-[100px]
            ${isActive
              ? "bg-white border-slate-300 text-slate-900 shadow-md"
              : "bg-white/50 border-transparent text-slate-500 hover:bg-white/80 hover:text-slate-700"
            }
          `}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-emerald-500" />
          )}
          {opt.label}
        </button>
      );
    })}
  </div>
);

// ─── Exported Component ───
const Solar3DShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(containerRef as React.RefObject<HTMLElement>);
  const [roofType, setRoofType] = useState<RoofType>("tuiles");

  // Trois configs séparées : tuiles, tôle, plate
  const [tuilesConfig, setTuilesConfig] = useState<DebugConfig>(() => loadConfig(STORAGE_KEY_TUILES, DEFAULT_CONFIG));
  const [toleConfig, setToleConfig] = useState<DebugConfig>(() => loadConfig(STORAGE_KEY_TOLE, DEFAULT_TOLE_CONFIG));
  const [flatConfig, setFlatConfig] = useState<DebugConfig>(() => loadConfig(STORAGE_KEY_FLAT, DEFAULT_FLAT_CONFIG));

  // Config active selon le type de toiture
  const config = roofType === "plate" ? flatConfig : roofType === "tole" ? toleConfig : tuilesConfig;

  const handleConfigChange = (c: DebugConfig) => {
    if (roofType === "plate") {
      setFlatConfig(c);
      localStorage.setItem(STORAGE_KEY_FLAT, JSON.stringify(c));
    } else if (roofType === "tole") {
      setToleConfig(c);
      localStorage.setItem(STORAGE_KEY_TOLE, JSON.stringify(c));
    } else {
      setTuilesConfig(c);
      localStorage.setItem(STORAGE_KEY_TUILES, JSON.stringify(c));
    }
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCamDisplay({ pos: camPosRef.current, rot: camRotRef.current });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const roofLabel = ROOF_OPTIONS.find(o => o.type === roofType)?.label ?? "";

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        height: "100vh",
        background: "linear-gradient(180deg, #87CEEB 0%, #B0D4F1 30%, #d4e8f7 60%, #e8f0f8 100%)",
      }}
    >
      {/* Sun glow top-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-80px",
          right: "-80px",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(255,223,100,0.7) 0%, rgba(255,200,50,0.3) 35%, rgba(255,180,0,0.05) 65%, transparent 80%)",
          borderRadius: "50%",
          filter: "blur(20px)",
        }}
      />
      {/* Subtle cloud shapes */}
      <div
        className="absolute pointer-events-none opacity-40"
        style={{
          top: "60px",
          left: "10%",
          width: "300px",
          height: "80px",
          background: "radial-gradient(ellipse, rgba(255,255,255,0.8) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(15px)",
        }}
      />
      <div
        className="absolute pointer-events-none opacity-30"
        style={{
          top: "120px",
          left: "45%",
          width: "350px",
          height: "90px",
          background: "radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(18px)",
        }}
      />
      <div
        className="absolute pointer-events-none opacity-25"
        style={{
          top: "40px",
          right: "20%",
          width: "250px",
          height: "70px",
          background: "radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(12px)",
        }}
      />
      <div className="sticky top-0 h-screen w-full">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(180deg, #87CEEB 0%, #d4e8f7 100%)" }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-sky-600/30 border-t-sky-600 rounded-full animate-spin" />
              <div className="text-sky-900/50 text-sm font-medium tracking-wide">Chargement de la scène 3D…</div>
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
            camera={{ position: [-8.16, 3.72, 10.62], fov: 35 }}
          >
            <Scene progress={progress} config={config} roofType={roofType} onCameraUpdate={handleCameraUpdate} />
          </Canvas>
        </Suspense>

        {/* Roof Type Selector */}
        <RoofTypeSelector selected={roofType} onSelect={setRoofType} />


        {/* Debug Panel */}
        <DebugPanel config={config} onChange={handleConfigChange} camPos={camDisplay.pos} camRot={camDisplay.rot} />

        {/* Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-start pt-6 lg:pt-8">
          <div className="container mx-auto px-6 max-w-5xl pl-[140px] lg:pl-[160px]">
            <div
              className="transition-opacity duration-500"
              style={{
                opacity: Math.max(0.15, progress > 0.08 ? Math.min(1, (progress - 0.08) / 0.1) : 0.15 + progress * 1.5),
              }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md text-sky-800 text-sm font-semibold mb-4 border border-white/40 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Installation professionnelle
              </span>
              <h2 className="text-3xl lg:text-6xl font-extrabold text-slate-800 leading-tight mb-4">
                Vos panneaux, posés avec
                <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent"> précision</span>
              </h2>
              <p className="text-slate-600 text-base lg:text-lg max-w-xl leading-relaxed">
                Chaque panneau est installé par nos techniciens certifiés RGE
                pour un rendement optimal et une intégration parfaite à votre toiture.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <div className="h-1.5 w-56 bg-slate-300/40 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.min(1, progress * 2) * 105)}%` }}
                />
              </div>
              <span className="text-slate-500 text-sm font-mono tracking-wider">
                {Math.min(16, Math.floor(Math.min(1, progress * 2) * 17))}/16 panneaux
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Solar3DShowcase;
