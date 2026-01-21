import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { Html } from '@react-three/drei';
import { RemotePlayer as RemotePlayerType } from '@/hooks/useMultiplayer';
import { SteveModel } from './SteveModel';

interface RemotePlayerProps {
  player: RemotePlayerType;
}

export function RemotePlayer({ player }: RemotePlayerProps) {
  const groupRef = useRef<Group>(null);
  const lastPosition = useRef(new Vector3(...player.position));
  const [isMoving, setIsMoving] = useState(false);

  useFrame(() => {
    if (!groupRef.current) return;

    const targetX = player.position[0];
    const targetY = player.position[1] - 1.5; // Offset for model feet
    const targetZ = player.position[2];

    // Smooth interpolation
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.12;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.12;
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.12;

    // Rotation with wrapping
    const targetRotation = player.rotation + Math.PI;
    let rotDiff = targetRotation - groupRef.current.rotation.y;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    groupRef.current.rotation.y += rotDiff * 0.12;

    // Detect movement
    const currentPos = new Vector3(
      groupRef.current.position.x,
      groupRef.current.position.y,
      groupRef.current.position.z
    );
    const distance = currentPos.distanceTo(lastPosition.current);
    setIsMoving(distance > 0.008);
    lastPosition.current.copy(currentPos);
  });

  return (
    <group ref={groupRef} position={[player.position[0], player.position[1] - 1.5, player.position[2]]}>
      {/* Steve model */}
      <SteveModel isMoving={isMoving} isMining={player.isMining} />
      
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.25} />
      </mesh>
      
      {/* Username label */}
      <Html position={[0, 2.2, 0]} center distanceFactor={15} zIndexRange={[0, 10]}>
        <div 
          className="px-3 py-1.5 rounded-lg text-white text-xs font-bold whitespace-nowrap select-none"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.85)',
            textShadow: '1px 1px 2px black',
            border: `2px solid ${player.color}`,
            boxShadow: `0 0 12px ${player.color}50`,
          }}
        >
          {player.username}
        </div>
      </Html>
    </group>
  );
}
