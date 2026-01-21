import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useGameStore } from '@/store/gameStore';

export function Pickaxe() {
  const groupRef = useRef<Group>(null);
  const isMining = useGameStore((state) => state.isMining);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Follow mouse slightly
    const x = (state.pointer.x * 0.5) + 2;
    const y = (state.pointer.y * 0.3) - 1;
    
    groupRef.current.position.x = x;
    groupRef.current.position.y = y;
    groupRef.current.position.z = 2;

    // Mining animation
    if (isMining) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 30) * 0.5;
    } else {
      groupRef.current.rotation.z = -0.3;
    }

    // Idle bobbing
    groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.02;
  });

  return (
    <group ref={groupRef} scale={0.4} rotation={[0.2, -0.5, -0.3]}>
      {/* Handle */}
      <mesh position={[0, -0.8, 0]}>
        <boxGeometry args={[0.15, 1.6, 0.15]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      
      {/* Head - Diamond */}
      <group position={[0, 0.3, 0]}>
        {/* Main head block */}
        <mesh>
          <boxGeometry args={[1.2, 0.4, 0.2]} />
          <meshStandardMaterial 
            color="#06b6d4" 
            emissive="#0891b2"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        
        {/* Left pick */}
        <mesh position={[-0.7, 0, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.5, 0.25, 0.15]} />
          <meshStandardMaterial 
            color="#06b6d4" 
            emissive="#0891b2"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        
        {/* Right pick */}
        <mesh position={[0.7, 0, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.5, 0.25, 0.15]} />
          <meshStandardMaterial 
            color="#06b6d4" 
            emissive="#0891b2"
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}
