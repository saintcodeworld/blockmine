import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group } from 'three';
import { useGameStore } from '@/store/gameStore';
import { SteveModel } from './SteveModel';

// Shows the player's own body below the camera (first-person body awareness)
export function LocalPlayerModel() {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();
  const isMining = useGameStore((state) => state.isMining);
  const player = useGameStore((state) => state.player);
  
  useFrame(() => {
    if (!groupRef.current || !player) return;
    
    // Position the model at the player's feet
    groupRef.current.position.x = camera.position.x;
    groupRef.current.position.y = camera.position.y - 1.5; // Below camera (at feet level)
    groupRef.current.position.z = camera.position.z;
    
    // Match camera rotation (only Y axis for body)
    groupRef.current.rotation.y = camera.rotation.y + Math.PI;
  });

  if (!player) return null;

  return (
    <group ref={groupRef}>
      {/* Only render the body parts visible in first person (arms and legs) */}
      <group scale={1.5}>
        {/* Left Arm - visible on left side */}
        <group position={[-0.5, 0.5, 0.3]}>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.25, 0.7, 0.25]} />
            <meshStandardMaterial color="#00a8a8" />
          </mesh>
          <mesh position={[0, -0.65, 0]}>
            <boxGeometry args={[0.25, 0.4, 0.25]} />
            <meshStandardMaterial color="#c4a47a" />
          </mesh>
        </group>

        {/* Right Arm - animated when mining */}
        <group position={[0.5, 0.5, 0.3]} rotation={[isMining ? -0.5 : 0, 0, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.25, 0.7, 0.25]} />
            <meshStandardMaterial color="#00a8a8" />
          </mesh>
          <mesh position={[0, -0.65, 0]}>
            <boxGeometry args={[0.25, 0.4, 0.25]} />
            <meshStandardMaterial color="#c4a47a" />
          </mesh>
        </group>

        {/* Legs - visible when looking down */}
        <group position={[-0.125, -0.4, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.25, 0.75, 0.25]} />
            <meshStandardMaterial color="#3232cd" />
          </mesh>
        </group>
        <group position={[0.125, -0.4, 0]}>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.25, 0.75, 0.25]} />
            <meshStandardMaterial color="#3232cd" />
          </mesh>
        </group>
      </group>
    </group>
  );
}
