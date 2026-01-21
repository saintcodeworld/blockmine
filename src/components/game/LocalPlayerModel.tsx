import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group } from 'three';
import { useGameStore } from '@/store/gameStore';
import { SteveModel } from './SteveModel';

// Shows the player's full body below the camera (visible when looking down)
export function LocalPlayerModel() {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();
  const isMining = useGameStore((state) => state.isMining);
  const player = useGameStore((state) => state.player);
  
  useFrame(() => {
    if (!groupRef.current || !player) return;
    
    // Position the model at the player's feet (below camera)
    groupRef.current.position.x = camera.position.x;
    groupRef.current.position.y = camera.position.y - 1.5; // Model feet level
    groupRef.current.position.z = camera.position.z;
    
    // Match camera Y rotation so body faces same direction as view
    groupRef.current.rotation.y = camera.rotation.y + Math.PI;
  });

  if (!player) return null;

  return (
    <group ref={groupRef}>
      {/* Full Steve model - visible when player looks down */}
      <SteveModel isMoving={false} isMining={isMining} />
    </group>
  );
}
