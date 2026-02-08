import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group } from 'three';
import { useGameStore } from '@/store/gameStore';

// Pickaxe that follows the camera (first-person view)
export function PickaxeHUD() {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();
  const isMining = useGameStore((state) => state.isMining);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Position pickaxe relative to camera
    groupRef.current.position.copy(camera.position);
    groupRef.current.rotation.copy(camera.rotation);
    
    // Offset to bottom-right of view
    const offset = camera.getWorldDirection(groupRef.current.position.clone());
    groupRef.current.position.add(offset.multiplyScalar(1.5));
    
    // Additional offset for hand position
    groupRef.current.translateX(0.6);
    groupRef.current.translateY(-0.4);

    // Mining swing animation
    if (isMining) {
      groupRef.current.rotation.z += Math.sin(state.clock.elapsedTime * 20) * 0.3;
    }
  });

  return (
    <group ref={groupRef} scale={0.25}>
      {/* Handle */}
      <mesh position={[0, -0.6, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.12, 1.2, 0.12]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      
      {/* Head */}
      <group position={[0, 0.2, 0]} rotation={[0, 0, 0.3]}>
        <mesh>
          <boxGeometry args={[0.8, 0.25, 0.12]} />
          <meshStandardMaterial 
            color="#06b6d4" 
            emissive="#0891b2"
            emissiveIntensity={0.5}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[-0.45, 0, 0]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.3, 0.15, 0.1]} />
          <meshStandardMaterial 
            color="#06b6d4" 
            emissive="#0891b2"
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh position={[0.45, 0, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.3, 0.15, 0.1]} />
          <meshStandardMaterial 
            color="#06b6d4" 
            emissive="#0891b2"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </group>
  );
}
