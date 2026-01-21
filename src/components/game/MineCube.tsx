import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Color } from 'three';
import { useGameStore } from '@/store/gameStore';

interface MineCubeProps {
  cube: {
    id: string;
    position: [number, number, number];
    type: 'stone' | 'gold' | 'diamond' | 'emerald' | 'ruby';
  };
  isSelected: boolean;
  onSelect: () => void;
}

const cubeColors: Record<string, string> = {
  stone: '#6b7280',
  gold: '#f59e0b',
  diamond: '#06b6d4',
  emerald: '#10b981',
  ruby: '#ef4444',
};

export function MineCube({ cube, isSelected, onSelect }: MineCubeProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const isMining = useGameStore((state) => state.isMining);
  const miningCubeId = useGameStore((state) => state.miningCubeId);
  const miningStartTime = useGameStore((state) => state.miningStartTime);
  const MINING_TIME = useGameStore((state) => state.MINING_TIME);
  const startMining = useGameStore((state) => state.startMining);
  const stopMining = useGameStore((state) => state.stopMining);

  const isBeingMined = miningCubeId === cube.id;
  const miningProgress = isBeingMined ? Math.min(1, (Date.now() - miningStartTime) / MINING_TIME) : 0;

  useFrame(() => {
    if (!meshRef.current) return;
    
    // Mining shake animation
    if (isBeingMined && isMining) {
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.05) * 0.1;
      meshRef.current.rotation.z = Math.cos(Date.now() * 0.05) * 0.1;
      meshRef.current.scale.setScalar(1 - miningProgress * 0.3);
    } else {
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.z = 0;
      meshRef.current.scale.setScalar(1);
    }

    // Hover/select rotation
    if ((hovered || isSelected) && !isBeingMined) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    
    if (isBeingMined) {
      // Already mining this cube, do nothing
      return;
    }
    
    if (isSelected) {
      // Second click - start mining
      startMining(cube.id);
    } else {
      // First click - select
      onSelect();
    }
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (isSelected) {
      startMining(cube.id);
    }
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    if (isBeingMined) {
      stopMining();
    }
  };

  return (
    <group position={cube.position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setHovered(false);
          if (isBeingMined) stopMining();
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.8, 1.8, 1.8]} />
        <meshStandardMaterial
          color={cubeColors[cube.type]}
          emissive={new Color(cubeColors[cube.type])}
          emissiveIntensity={isBeingMined ? 0.8 : (hovered || isSelected ? 0.4 : 0.1)}
        />
      </mesh>
      
      {/* Selection outline */}
      {isSelected && !isBeingMined && (
        <mesh scale={1.05}>
          <boxGeometry args={[1.8, 1.8, 1.8]} />
          <meshBasicMaterial color="#00ffff" wireframe />
        </mesh>
      )}

      {/* Mining progress indicator */}
      {isBeingMined && (
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[miningProgress * 2, 0.2, 0.2]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      )}
    </group>
  );
}
