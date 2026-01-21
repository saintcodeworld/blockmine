import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Color, BoxGeometry } from 'three';
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

const cubeEmissive: Record<Cube['type'], string> = {
  stone: '#1f2937',
  gold: '#b45309',
  diamond: '#0891b2',
  emerald: '#059669',
  ruby: '#dc2626',
};

export function MineCube({ cube, isSelected, onSelect, onMine }: MineCubeProps) {
  const meshRef = useRef<Mesh>(null);
  const outlineRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Rotation when hovered or selected
    if (hovered || isSelected) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.rotation.x += 0.01;
    }

    // Scale based on health
    const healthScale = 0.8 + (cube.health / cube.maxHealth) * 0.2;
    const targetScale = isSelected ? healthScale * 1.15 : healthScale;
    meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as any, 0.1);

    // Outline follows main mesh
    if (outlineRef.current && isSelected) {
      outlineRef.current.rotation.copy(meshRef.current.rotation);
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
      {/* Main cube */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={cubeColors[cube.type]}
          emissive={new Color(cubeEmissive[cube.type])}
          emissiveIntensity={hovered || isSelected ? 0.8 : 0.3}
          roughness={0.3}
          metalness={cube.type === 'diamond' || cube.type === 'gold' ? 0.8 : 0.2}
        />
      </mesh>

      {/* Selection outline */}
      {isSelected && (
        <mesh ref={outlineRef} scale={1.08}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#00ffff" wireframe />
        </mesh>
      )}

      {/* Health bar */}
      {isSelected && cube.health < cube.maxHealth && (
        <group position={[0, 1, 0]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1, 0.1]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[(cube.health / cube.maxHealth - 1) * 0.5, 0, 0.01]}>
            <planeGeometry args={[cube.health / cube.maxHealth, 0.08]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
        </group>
      )}
    </group>
  );
}
