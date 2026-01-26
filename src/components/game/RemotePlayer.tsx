import { useRef, useState, useEffect, useMemo } from 'react';
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
  
  // Use refs for smooth interpolation targets
  const targetPosition = useRef(new Vector3(...player.position));
  const targetRotation = useRef(player.rotation);
  const lastFramePosition = useRef(new Vector3(...player.position));
  const [isMoving, setIsMoving] = useState(false);
  const movementThreshold = useRef(0);

  // Update targets when player data changes
  useEffect(() => {
    targetPosition.current.set(player.position[0], player.position[1], player.position[2]);
    targetRotation.current = player.rotation;
  }, [player.position[0], player.position[1], player.position[2], player.rotation]);

  // Initial position calculation
  const initialPosition = useMemo(() => {
    return new Vector3(player.position[0], player.position[1] - 0.5, player.position[2]);
  }, []); // Only compute once on mount

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const lerpFactor = Math.min(1, delta * 8); // Smoother, frame-rate independent

    // Smooth position interpolation
    const targetX = targetPosition.current.x;
    const targetY = targetPosition.current.y - 0.5; // Offset for model feet
    const targetZ = targetPosition.current.z;

    groupRef.current.position.x += (targetX - groupRef.current.position.x) * lerpFactor;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * lerpFactor;
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * lerpFactor;

    // Smooth rotation interpolation with wrapping
    const targetRot = targetRotation.current + Math.PI;
    let rotDiff = targetRot - groupRef.current.rotation.y;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    groupRef.current.rotation.y += rotDiff * lerpFactor;

    // Detect movement with hysteresis to avoid flickering
    const currentPos = groupRef.current.position;
    const moveDist = Math.sqrt(
      Math.pow(currentPos.x - lastFramePosition.current.x, 2) +
      Math.pow(currentPos.z - lastFramePosition.current.z, 2)
    );
    
    // Use hysteresis: higher threshold to stop, lower to start
    if (isMoving) {
      movementThreshold.current = Math.max(0, movementThreshold.current - delta);
      if (moveDist < 0.001 && movementThreshold.current <= 0) {
        setIsMoving(false);
      }
    } else {
      if (moveDist > 0.01) {
        setIsMoving(true);
        movementThreshold.current = 0.1; // Keep moving for at least 0.1 seconds
      }
    }
    
    lastFramePosition.current.set(currentPos.x, currentPos.y, currentPos.z);
  });

  return (
    <group ref={groupRef} position={initialPosition}>
      {/* Steve model */}
      <SteveModel isMoving={isMoving} isMining={player.isMining} />
      
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <circleGeometry args={[0.7, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.3} />
      </mesh>
      
      {/* Username label */}
      <Html position={[0, 2.5, 0]} center distanceFactor={12} zIndexRange={[0, 10]}>
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
          {player.isMining && <span className="ml-1">⛏️</span>}
        </div>
      </Html>
    </group>
  );
}
