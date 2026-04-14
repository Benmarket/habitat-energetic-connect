import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

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

const ROOF_ANGLE = Math.PI * 0.25; // 45 degrees

// ─── Single Solar Panel ───
interface PanelProps {
  position: [number, number, number];
  delay: number;
  progress: number;
  index: number;
}

const SolarPanel = ({ position, delay, progress, index }: PanelProps) => {
  const meshRef = useRef<THREE.Group>(null);
  
  const panelProgress = Math.max(0, Math.min(1, (progress - delay) / 0.1));
  const ease = (t: number) => {
    // Bounce ease out for a satisfying "click" when panel lands
    if (t < 0.6) return (t / 0.6) * (t / 0.6);
    const bounce = (t - 0.6) / 0.4;
    return 1 - Math.sin(bounce * Math.PI) * 0.08 * (1 - bounce);
  };
  const easedProgress = ease(panelProgress);
  
  const startY = 6 + index * 0.3;
  const targetY = position[1];
  const y = startY + (targetY - startY) * easedProgress;
  const opacity = Math.min(1, panelProgress * 3);
  const scale = 0.4 + 0.6 * easedProgress;

  // Panel "wobble" rotation while falling
  const wobble = panelProgress < 1 ? Math.sin(panelProgress * Math.PI * 3) * 0.08 * (1 - panelProgress) : 0;

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.position.set(position[0], y, position[2]);
    meshRef.current.rotation.z = wobble;
    meshRef.current.scale.setScalar(scale);
    
    // Subtle shimmer once placed
    if (panelProgress >= 1) {
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.8 + index * 0.7) * 0.008;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Aluminium frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.55, 0.055, 0.95]} />
        <meshStandardMaterial
          color="#2a2a3a"
          metalness={0.95}
          roughness={0.15}
          transparent
          opacity={opacity}
        />
      </mesh>
      {/* Glass photovoltaic surface */}
      <mesh position={[0, 0.032, 0]} castShadow>
        <boxGeometry args={[1.44, 0.012, 0.84]} />
        <meshPhysicalMaterial
          color="#0d1f3c"
          metalness={0.95}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.02}
          transparent
          opacity={opacity * 0.97}
          envMapIntensity={2.5}
          reflectivity={1}
          ior={1.52}
        />
      </mesh>
      {/* Cell grid - horizontal */}
      {[...Array(6)].map((_, i) => (
        <mesh key={`h${i}`} position={[0, 0.039, -0.35 + i * 0.14]}>
          <boxGeometry args={[1.44, 0.003, 0.008]} />
          <meshStandardMaterial color="#1a3355" transparent opacity={opacity * 0.5} />
        </mesh>
      ))}
      {/* Cell grid - vertical */}
      {[...Array(10)].map((_, i) => (
        <mesh key={`v${i}`} position={[-0.65 + i * 0.144, 0.039, 0]}>
          <boxGeometry args={[0.008, 0.003, 0.84]} />
          <meshStandardMaterial color="#1a3355" transparent opacity={opacity * 0.5} />
        </mesh>
      ))}
      {/* Frame edge highlights */}
      {[
        [0, 0.02, 0.475, 1.56, 0.04, 0.02],
        [0, 0.02, -0.475, 1.56, 0.04, 0.02],
        [0.775, 0.02, 0, 0.02, 0.04, 0.97],
        [-0.775, 0.02, 0, 0.02, 0.04, 0.97],
      ].map(([x, y2, z, w, h, d], i) => (
        <mesh key={`edge${i}`} position={[x, y2, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#404050" metalness={0.9} roughness={0.2} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
};

// ─── Pitched Roof (45°) ───
const Roof = () => {
  // Create a proper pitched roof shape
  const roofWidth = 8;
  const roofDepth = 5.5;
  const tileRows = 14;
  
  return (
    <group position={[0, -1.2, 0.5]} rotation={[-ROOF_ANGLE, 0, 0]}>
      {/* Main roof slab */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[roofWidth, 0.12, roofDepth]} />
        <meshStandardMaterial 
          color="#b07848"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      
      {/* Terracotta tile rows */}
      {[...Array(tileRows)].map((_, i) => (
        <group key={i} position={[0, 0.07, -roofDepth / 2 + 0.3 + i * (roofDepth / tileRows)]}>
          <mesh receiveShadow>
            <boxGeometry args={[roofWidth - 0.1, 0.04, 0.32]} />
            <meshStandardMaterial 
              color={i % 2 === 0 ? "#a06838" : "#b87848"}
              roughness={0.92}
              metalness={0.02}
            />
          </mesh>
          {/* Tile ridge detail */}
          <mesh position={[0, 0.025, 0]}>
            <boxGeometry args={[roofWidth - 0.1, 0.015, 0.15]} />
            <meshStandardMaterial 
              color={i % 2 === 0 ? "#c08858" : "#b07040"}
              roughness={0.95}
            />
          </mesh>
        </group>
      ))}
      
      {/* Ridge cap at top */}
      <mesh position={[0, 0.1, -roofDepth / 2 - 0.05]} castShadow>
        <boxGeometry args={[roofWidth + 0.15, 0.18, 0.2]} />
        <meshStandardMaterial color="#8a5530" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Eave at bottom */}
      <mesh position={[0, -0.02, roofDepth / 2 + 0.08]} castShadow>
        <boxGeometry args={[roofWidth + 0.3, 0.22, 0.18]} />
        <meshStandardMaterial color="#6a4020" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Side trims */}
      <mesh position={[roofWidth / 2 + 0.08, 0.05, 0]}>
        <boxGeometry args={[0.12, 0.16, roofDepth + 0.4]} />
        <meshStandardMaterial color="#7a4828" roughness={0.85} />
      </mesh>
      <mesh position={[-roofWidth / 2 - 0.08, 0.05, 0]}>
        <boxGeometry args={[0.12, 0.16, roofDepth + 0.4]} />
        <meshStandardMaterial color="#7a4828" roughness={0.85} />
      </mesh>
    </group>
  );
};

// ─── Wall beneath roof ───
const HouseWall = () => {
  return (
    <group position={[0, -4.2, 2.8]}>
      <mesh receiveShadow>
        <boxGeometry args={[8.3, 3.5, 0.2]} />
        <meshStandardMaterial color="#e8ddd0" roughness={0.95} metalness={0} />
      </mesh>
      {/* Window */}
      <mesh position={[-1.8, 0.3, 0.11]}>
        <boxGeometry args={[1.2, 1.4, 0.02]} />
        <meshPhysicalMaterial color="#87CEEB" metalness={0.1} roughness={0.05} clearcoat={1} transmission={0.3} />
      </mesh>
      <mesh position={[1.8, 0.3, 0.11]}>
        <boxGeometry args={[1.2, 1.4, 0.02]} />
        <meshPhysicalMaterial color="#87CEEB" metalness={0.1} roughness={0.05} clearcoat={1} transmission={0.3} />
      </mesh>
    </group>
  );
};

// ─── Onduleur (Inverter) ───
const Inverter = ({ progress }: { progress: number }) => {
  const ref = useRef<THREE.Group>(null);
  const show = progress > 0.82;
  const localP = show ? Math.min(1, (progress - 0.82) / 0.1) : 0;
  const ease = 1 - Math.pow(1 - localP, 4);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.scale.setScalar(ease);
    ref.current.position.y = -3.8 + (1 - ease) * 1.5;
    // Subtle pulse on LED
    const led = ref.current.children[2] as THREE.Mesh;
    if (led?.material && 'emissiveIntensity' in (led.material as any)) {
      (led.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.8;
    }
  });

  return (
    <group ref={ref} position={[5, -3.8, 2.9]}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.55, 0.75, 0.18]} />
        <meshStandardMaterial color="#f0f0f0" metalness={0.4} roughness={0.35} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.1, 0.1]}>
        <boxGeometry args={[0.32, 0.18, 0.01]} />
        <meshStandardMaterial color="#00cc66" emissive="#00cc66" emissiveIntensity={0.6} />
      </mesh>
      {/* LED */}
      <mesh position={[0, -0.18, 0.1]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
      </mesh>
      {/* Brand label */}
      <mesh position={[0, -0.28, 0.1]}>
        <boxGeometry args={[0.25, 0.06, 0.005]} />
        <meshStandardMaterial color="#ccc" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
};

// ─── Scene Camera Controller ───
const CameraController = ({ progress }: { progress: number }) => {
  const { camera } = useThree();

  useFrame(() => {
    // Cinematic orbit: starts high/wide, moves closer and lower
    const angle = -0.5 + progress * 0.6;
    const radius = 12 - progress * 3;
    const height = 7 - progress * 2.5;
    
    camera.position.x = Math.sin(angle) * radius;
    camera.position.z = Math.cos(angle) * radius;
    camera.position.y = height;
    camera.lookAt(0, -1.5, 0);
  });

  return null;
};

// ─── Main Scene ───
const Scene = ({ progress }: { progress: number }) => {
  const panels = useMemo(() => {
    const items: { pos: [number, number, number]; delay: number }[] = [];
    const cols = 4;
    const rows = 3;
    let idx = 0;
    // Panels must sit ON the tilted roof surface
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const localX = -2.5 + c * 1.7;
        const localZ = -1.0 + r * 1.1;
        // Transform from roof-local to world coords (roof is at 45°)
        const worldY = -1.2 + 0.1 + (-localZ - 0.5) * Math.sin(ROOF_ANGLE) * -1 + 0.08;
        const worldZ = 0.5 + localZ * Math.cos(ROOF_ANGLE);
        items.push({
          pos: [localX, worldY, worldZ],
          delay: 0.08 + idx * 0.055,
        });
        idx++;
      }
    }
    return items;
  }, []);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-6, 10, -4]} intensity={0.5} color="#ffd4a0" />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#fff5e0" />
      
      <Environment preset="sunset" />
      <fog attach="fog" args={["#0a1628", 15, 35]} />
      
      <CameraController progress={progress} />
      
      <Roof />
      <HouseWall />
      
      {/* Panels inherit roof rotation */}
      <group rotation={[-ROOF_ANGLE, 0, 0]} position={[0, -1.2, 0.5]}>
        {panels.map((p, i) => (
          <SolarPanel
            key={i}
            position={[p.pos[0], 0.12, -1.0 + (i % 3 === 0 ? 0 : i % 3 === 1 ? 1.1 : 2.2) - 0.3 + Math.floor(i / 3) * 0 + (i < 4 ? 0 : i < 8 ? 1.1 : 2.2) * 0]}
            delay={p.delay}
            progress={progress}
            index={i}
          />
        ))}
      </group>
      
      <Inverter progress={progress} />
      
      <ContactShadows
        position={[0, -5.8, 0]}
        opacity={0.5}
        scale={25}
        blur={2.5}
        far={12}
      />
    </>
  );
};

// Recalculate panel positions properly
const SceneFixed = ({ progress }: { progress: number }) => {
  const panels = useMemo(() => {
    const items: { pos: [number, number, number]; delay: number }[] = [];
    const cols = 4;
    const rows = 3;
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        items.push({
          pos: [
            -2.5 + c * 1.7,
            0.12,
            -1.2 + r * 1.15,
          ],
          delay: 0.08 + idx * 0.055,
        });
        idx++;
      }
    }
    return items;
  }, []);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[10, 15, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-6, 10, -4]} intensity={0.5} color="#ffd4a0" />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#fff5e0" />
      
      <Environment preset="sunset" />
      <fog attach="fog" args={["#0a1628", 18, 40]} />
      
      <CameraController progress={progress} />
      
      <Roof />
      <HouseWall />
      
      {/* Panels sit on the roof (same rotation group) */}
      <group position={[0, -1.2, 0.5]} rotation={[-ROOF_ANGLE, 0, 0]}>
        {panels.map((p, i) => (
          <SolarPanel
            key={i}
            position={p.pos}
            delay={p.delay}
            progress={progress}
            index={i}
          />
        ))}
      </group>
      
      <Inverter progress={progress} />
      
      <ContactShadows
        position={[0, -5.8, 0]}
        opacity={0.5}
        scale={25}
        blur={2.5}
        far={12}
      />
    </>
  );
};

// ─── Exported Component ───
const Solar3DShowcase = () => {
  const containerRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(containerRef as React.RefObject<HTMLElement>);

  return (
    <section
      ref={containerRef as React.RefObject<HTMLElement>}
      className="relative bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628] overflow-hidden"
      style={{ height: "130vh" }}
    >
      {/* Sticky canvas */}
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
            camera={{ position: [10, 7, 10], fov: 35 }}
          >
            <SceneFixed progress={progress} />
          </Canvas>
        </Suspense>
        
        {/* Overlay UI */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-16 lg:pb-24">
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

            {/* Progress bar */}
            <div className="mt-8 flex items-center gap-4">
              <div className="h-1.5 w-56 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-150"
                  style={{ width: `${Math.min(100, progress * 125)}%` }}
                />
              </div>
              <span className="text-white/30 text-sm font-mono tracking-wider">
                {Math.min(12, Math.floor(progress * 14))}/12 panneaux
              </span>
            </div>
          </div>
        </div>

        {/* Gradient fades */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>
    </section>
  );
};

export default Solar3DShowcase;
