import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, Float } from "@react-three/drei";
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
      // progress 0 = section just enters viewport, 1 = section fully scrolled past
      const raw = 1 - (rect.bottom - viewH * 0.3) / (rect.height + viewH * 0.3);
      setProgress(Math.max(0, Math.min(1, raw)));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  return progress;
};

// ─── Single Solar Panel ───
interface PanelProps {
  position: [number, number, number];
  delay: number; // 0-1 normalized delay
  progress: number;
  index: number;
}

const SolarPanel = ({ position, delay, progress, index }: PanelProps) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Panel animates when progress passes its delay threshold
  const panelProgress = Math.max(0, Math.min(1, (progress - delay) / 0.12));
  
  // Smooth easing
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const easedProgress = ease(panelProgress);
  
  const startY = 8 + index * 0.5;
  const y = startY + (position[1] - startY) * easedProgress;
  const rotX = (-Math.PI * 0.5 + Math.PI * 0.3) * easedProgress + (-Math.PI * 0.5) * (1 - easedProgress);
  const opacity = easedProgress;
  const scale = 0.3 + 0.7 * easedProgress;

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.position.set(position[0], y, position[2]);
    meshRef.current.rotation.x = -0.35; // roof angle
    meshRef.current.scale.setScalar(scale);
    
    // Subtle floating when placed
    if (panelProgress >= 1) {
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.02;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Panel frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.06, 1]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={opacity}
        />
      </mesh>
      {/* Glass surface */}
      <mesh position={[0, 0.035, 0]} castShadow>
        <boxGeometry args={[1.5, 0.01, 0.9]} />
        <meshPhysicalMaterial
          color="#1e3a5f"
          metalness={0.9}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
          opacity={opacity * 0.95}
          envMapIntensity={2}
        />
      </mesh>
      {/* Grid lines - horizontal */}
      {[...Array(5)].map((_, i) => (
        <mesh key={`h${i}`} position={[0, 0.04, -0.36 + i * 0.18]}>
          <boxGeometry args={[1.5, 0.005, 0.01]} />
          <meshStandardMaterial color="#2a4a6a" transparent opacity={opacity * 0.6} />
        </mesh>
      ))}
      {/* Grid lines - vertical */}
      {[...Array(8)].map((_, i) => (
        <mesh key={`v${i}`} position={[-0.66 + i * 0.19, 0.04, 0]}>
          <boxGeometry args={[0.01, 0.005, 0.9]} />
          <meshStandardMaterial color="#2a4a6a" transparent opacity={opacity * 0.6} />
        </mesh>
      ))}
    </group>
  );
};

// ─── Roof ───
const Roof = () => {
  return (
    <group position={[0, -1, 0]} rotation={[-0.35, 0, 0]}>
      {/* Main roof surface */}
      <mesh receiveShadow>
        <boxGeometry args={[8, 0.15, 6]} />
        <meshStandardMaterial 
          color="#c4956a"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
      {/* Roof tiles texture effect - rows of slight bumps */}
      {[...Array(12)].map((_, i) => (
        <mesh key={i} position={[0, 0.08, -2.7 + i * 0.5]} receiveShadow>
          <boxGeometry args={[8, 0.03, 0.2]} />
          <meshStandardMaterial color="#b8845a" roughness={0.95} />
        </mesh>
      ))}
      {/* Roof edge trim */}
      <mesh position={[0, 0, 3.05]}>
        <boxGeometry args={[8.2, 0.2, 0.15]} />
        <meshStandardMaterial color="#8a6040" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, -3.05]}>
        <boxGeometry args={[8.2, 0.2, 0.15]} />
        <meshStandardMaterial color="#8a6040" roughness={0.8} />
      </mesh>
    </group>
  );
};

// ─── Onduleur (Inverter) ───
const Inverter = ({ progress }: { progress: number }) => {
  const ref = useRef<THREE.Group>(null);
  const show = progress > 0.85;
  const localP = show ? Math.min(1, (progress - 0.85) / 0.1) : 0;
  const ease = 1 - Math.pow(1 - localP, 3);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.scale.setScalar(ease);
    ref.current.position.y = -2.5 + (1 - ease) * 2;
  });

  return (
    <group ref={ref} position={[4.5, -2.5, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.8, 0.2]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.1, 0.11]}>
        <boxGeometry args={[0.35, 0.2, 0.01]} />
        <meshStandardMaterial color="#00cc66" emissive="#00cc66" emissiveIntensity={0.5} />
      </mesh>
      {/* LED */}
      <mesh position={[0, -0.15, 0.11]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

// ─── Scene Camera Controller ───
const CameraController = ({ progress }: { progress: number }) => {
  const { camera } = useThree();

  useFrame(() => {
    // Camera orbits slightly based on scroll
    const angle = -0.3 + progress * 0.4;
    const radius = 10 - progress * 2;
    const height = 5 - progress * 1;
    
    camera.position.x = Math.sin(angle) * radius;
    camera.position.z = Math.cos(angle) * radius;
    camera.position.y = height;
    camera.lookAt(0, -0.5, 0);
  });

  return null;
};

// ─── Main Scene ───
const Scene = ({ progress }: { progress: number }) => {
  // Panel grid layout (3 columns x 4 rows)
  const panels = useMemo(() => {
    const items: { pos: [number, number, number]; delay: number }[] = [];
    const cols = 4;
    const rows = 3;
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        items.push({
          pos: [
            -2.6 + c * 1.75,
            -0.75,
            -1.2 + r * 1.15,
          ],
          delay: 0.1 + idx * 0.055,
        });
        idx++;
      }
    }
    return items;
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 12, 5]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-5, 8, -3]} intensity={0.4} color="#ffd4a0" />
      
      <Environment preset="sunset" />
      
      <CameraController progress={progress} />
      
      <Roof />
      
      {panels.map((p, i) => (
        <SolarPanel
          key={i}
          position={p.pos}
          delay={p.delay}
          progress={progress}
          index={i}
        />
      ))}
      
      <Inverter progress={progress} />
      
      <ContactShadows
        position={[0, -3.5, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={10}
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
      style={{ height: "120vh" }}
    >
      {/* Sticky canvas */}
      <div className="sticky top-0 h-screen w-full">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center bg-[#0a1628]">
            <div className="text-white/60 text-lg font-medium">Chargement de la scène 3D...</div>
          </div>
        }>
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            camera={{ position: [8, 5, 8], fov: 40 }}
          >
            <Scene progress={progress} />
          </Canvas>
        </Suspense>
        
        {/* Overlay text */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end pb-16 lg:pb-24">
          <div className="container mx-auto px-6 max-w-5xl">
            <div
              className="transition-all duration-700"
              style={{
                opacity: progress > 0.3 ? Math.min(1, (progress - 0.3) / 0.2) : 0,
                transform: `translateY(${progress > 0.3 ? 0 : 30}px)`,
              }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm font-semibold mb-4 border border-white/10">
                🔧 Installation professionnelle
              </span>
              <h2 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-3">
                Vos panneaux, posés avec
                <span className="text-emerald-400"> précision</span>
              </h2>
              <p className="text-white/60 text-base lg:text-lg max-w-lg">
                Chaque panneau est installé par nos techniciens certifiés RGE 
                pour un rendement optimal et une intégration parfaite à votre toiture.
              </p>
            </div>

            {/* Progress indicator */}
            <div className="mt-8 flex items-center gap-4">
              <div className="h-1 w-48 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-100"
                  style={{ width: `${Math.min(100, progress * 120)}%` }}
                />
              </div>
              <span className="text-white/40 text-sm font-mono">
                {Math.min(12, Math.floor(progress * 14))}/12 panneaux
              </span>
            </div>
          </div>
        </div>

        {/* Top gradient fade */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent pointer-events-none" />
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>
    </section>
  );
};

export default Solar3DShowcase;
