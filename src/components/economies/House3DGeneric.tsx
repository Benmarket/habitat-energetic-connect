import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";

interface Props {
  hasSolar: boolean;
  hasInsulationWalls: boolean;
  hasInsulationRoof: boolean;
  hasHeating: boolean;
  hasVentilation: boolean;
}

const wallColor = (active: boolean) => (active ? "#10b981" : "#cbd5e1");
const roofColor = (active: boolean) => (active ? "#f59e0b" : "#94a3b8");

const House = ({ hasSolar, hasInsulationWalls, hasInsulationRoof, hasHeating, hasVentilation }: Props) => {
  return (
    <group>
      {/* Sol */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[8, 0.1, 8]} />
        <meshStandardMaterial color="#86efac" />
      </mesh>

      {/* Murs */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[3, 2.5, 3]} />
        <meshStandardMaterial
          color={wallColor(hasInsulationWalls)}
          transparent
          opacity={hasInsulationWalls ? 0.95 : 0.55}
        />
      </mesh>

      {/* Toit */}
      <mesh position={[0, 2.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.4, 1.4, 4]} />
        <meshStandardMaterial
          color={roofColor(hasInsulationRoof)}
          transparent
          opacity={hasInsulationRoof ? 0.95 : 0.55}
        />
      </mesh>

      {/* Panneaux solaires */}
      {hasSolar && (
        <group position={[0.4, 2.55, 0.4]} rotation={[-Math.PI / 6, Math.PI / 4, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.4, 0.04, 0.9]} />
            <meshStandardMaterial color="#1e3a8a" emissive="#3b82f6" emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}

      {/* Porte */}
      <mesh position={[0, 0.6, 1.51]}>
        <boxGeometry args={[0.5, 1.2, 0.02]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>

      {/* Fenêtres */}
      <mesh position={[-0.9, 1.4, 1.51]}>
        <boxGeometry args={[0.5, 0.5, 0.02]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#0ea5e9" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.9, 1.4, 1.51]}>
        <boxGeometry args={[0.5, 0.5, 0.02]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#0ea5e9" emissiveIntensity={0.2} />
      </mesh>

      {/* Cheminée si chauffage */}
      {hasHeating && (
        <mesh position={[0.8, 3.2, 0]} castShadow>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial color="#dc2626" emissive="#ef4444" emissiveIntensity={0.3} />
        </mesh>
      )}

      {/* VMC sur toit */}
      {hasVentilation && (
        <mesh position={[-0.7, 3.4, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 12]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      )}
    </group>
  );
};

const House3DGeneric = (props: Props) => {
  return (
    <div className="w-full h-[420px] rounded-2xl overflow-hidden bg-gradient-to-b from-sky-100 to-sky-50">
      <Canvas shadows camera={{ position: [6, 4, 6], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
        <Suspense fallback={null}>
          <House {...props} />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={5} maxDistance={15} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
};

export default House3DGeneric;
