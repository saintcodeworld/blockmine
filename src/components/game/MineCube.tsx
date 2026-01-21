import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Color, Vector3 } from 'three';
import { useGameStore } from '@/store/gameStore';
import { useMinecraftTextures, CubeType } from './MinecraftTextures';

interface MineCubeProps {
  cube: {
    id: string;
    position: [number, number, number];
    type: CubeType;
  };
  isSelected: boolean;
  onSelect: () => void;
  playerPosition: [number, number, number];
}

// Maximum distance player can reach to mine a block
const MINING_REACH = 5;

export function MineCube({ cube, isSelected, onSelect, playerPosition }: MineCubeProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const textures = useMinecraftTextures();
  
  const isMining = useGameStore((state) => state.isMining);
  const miningCubeId = useGameStore((state) => state.miningCubeId);
  const miningStartTime = useGameStore((state) => state.miningStartTime);
  const MINING_TIME = useGameStore((state) => state.MINING_TIME);
  const startMining = useGameStore((state) => state.startMining);
  const stopMining = useGameStore((state) => state.stopMining);

  const isBeingMined = miningCubeId === cube.id;
  const miningProgress = isBeingMined ? Math.min(1, (Date.now() - miningStartTime) / MINING_TIME) : 0;

  // Get the texture for this cube type
  const texture = textures[cube.type];

  // Calculate distance from player to cube
  const distance = useMemo(() => {
    const cubePos = new Vector3(...cube.position);
    const safePlayerPos = playerPosition || [0, 2, 8];
    const playerPos = new Vector3(...safePlayerPos);
    return cubePos.distanceTo(playerPos);
  }, [cube.position, playerPosition]);

  const isInRange = distance <= MINING_REACH;

  useFrame(() => {
    if (!meshRef.current) return;
    
    // Mining shake animation
    if (isBeingMined && isMining) {
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.05) * 0.1;
      meshRef.current.rotation.z = Math.cos(Date.now() * 0.05) * 0.1;
      const scale = 1 - miningProgress * 0.3;
      meshRef.current.scale.setScalar(scale);
    } else {
      meshRef.current.rotation.x *= 0.9;
      meshRef.current.rotation.z *= 0.9;
      meshRef.current.scale.lerp(new Vector3(1, 1, 1), 0.1);
    }

    // Hover/select rotation
    if ((hovered || isSelected) && !isBeingMined && isInRange) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    
    if (!isInRange) return; // Can't interact if too far
    
    if (isBeingMined) return;
    
    if (isSelected) {
      startMining(cube.id);
    } else {
      onSelect();
    }
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (isSelected && isInRange) {
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
        onPointerOver={(e) => { 
          e.stopPropagation(); 
          setHovered(true); 
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.8, 1.8, 1.8]} />
        <meshStandardMaterial
          map={texture}
          transparent={!isInRange}
          opacity={isInRange ? 1 : 0.5}
        />
      </mesh>
      
      {/* Selection outline - only show if in range */}
      {isSelected && !isBeingMined && isInRange && (
        <mesh scale={1.02}>
          <boxGeometry args={[1.8, 1.8, 1.8]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      )}

      {/* Out of range indicator */}
      {isSelected && !isInRange && (
        <mesh scale={1.02}>
          <boxGeometry args={[1.8, 1.8, 1.8]} />
          <meshBasicMaterial color="#ff0000" wireframe opacity={0.5} transparent />
        </mesh>
      )}

      {/* Mining progress bar */}
      {isBeingMined && (
        <>
          {/* Background bar */}
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[2, 0.15, 0.15]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          {/* Progress bar */}
          <mesh position={[-1 + miningProgress, 1.5, 0.01]}>
            <boxGeometry args={[miningProgress * 2, 0.12, 0.12]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
        </>
      )}

      {/* Crack overlay when being mined */}
      {isBeingMined && miningProgress > 0.2 && (
        <mesh scale={1.01}>
          <boxGeometry args={[1.8, 1.8, 1.8]} />
          <meshBasicMaterial 
            color="#000000" 
            wireframe 
            opacity={miningProgress * 0.5} 
            transparent 
          />
        </mesh>
      )}
    </group>
  );
}
