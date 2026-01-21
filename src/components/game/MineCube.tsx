import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, Color, Vector3 } from 'three';
import { Cube } from '@/store/gameStore';

interface MineCubeProps {
  cube: Cube;
  isSelected: boolean;
  onSelect: () => void;
  onMine: () => void;
}

const cubeColors: Record<Cube['type'], string> = {
  stone: '#6b7280',
  gold: '#f59e0b',
  diamond: '#06b6d4',
  emerald: '#10b981',
  ruby: '#ef4444',
};

export function MineCube({ cube, isSelected, onSelect, onMine }: MineCubeProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!meshRef.current) return;
    if (hovered || isSelected) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (isSelected) {
      onMine();
    } else {
      onSelect();
    }
  };

  return (
    <group position={cube.position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.9, 1.9, 1.9]} />
        <meshStandardMaterial
          color={cubeColors[cube.type]}
          emissive={new Color(cubeColors[cube.type])}
          emissiveIntensity={hovered || isSelected ? 0.5 : 0.1}
        />
      </mesh>
      {isSelected && (
        <mesh scale={1.05}>
          <boxGeometry args={[1.9, 1.9, 1.9]} />
          <meshBasicMaterial color="#00ffff" wireframe />
        </mesh>
      )}
    </group>
  );
}
