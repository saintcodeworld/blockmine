import { useRef, useState, useMemo } from 'react';
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
  
  // Use refs for smooth interpolation - avoid state updates in frame loop
  const targetPosition = useRef(new Vector3(...player.position));
  const targetRotation = useRef(player.rotation);
  const velocity = useRef(new Vector3(...(player.velocity || [0, 0, 0])));
  const lastFramePosition = useRef(new Vector3(...player.position));
  const lastPlayerUpdate = useRef(player.lastUpdate || Date.now());
  const isMovingRef = useRef(false);
  const movementThreshold = useRef(0);
  const [isMoving, setIsMoving] = useState(false);

  // Initial position calculation
  const initialPosition = useMemo(() => {
    return new Vector3(player.position[0], player.position[1] - 0.5, player.position[2]);
  }, []); // Only compute once on mount

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Check for new updates from network
    if (player.lastUpdate !== lastPlayerUpdate.current) {
      lastPlayerUpdate.current = player.lastUpdate;
      targetPosition.current.set(player.position[0], player.position[1], player.position[2]);
      targetRotation.current = player.rotation;
      velocity.current.set(
        player.velocity?.[0] || 0,
        player.velocity?.[1] || 0,
        player.velocity?.[2] || 0
      );
    }

    // Apply velocity-based prediction for smoother movement between updates
    const timeSinceUpdate = (Date.now() - lastPlayerUpdate.current) / 1000;
    const maxPrediction = 0.15; // Cap prediction to 150ms
    const predictionTime = Math.min(timeSinceUpdate, maxPrediction);
    
    const predictedX = targetPosition.current.x + velocity.current.x * predictionTime;
    const predictedY = targetPosition.current.y + velocity.current.y * predictionTime;
    const predictedZ = targetPosition.current.z + velocity.current.z * predictionTime;

    // Adaptive lerp - faster when far, slower when close
    const distanceToTarget = Math.sqrt(
      Math.pow(predictedX - groupRef.current.position.x, 2) +
      Math.pow(predictedZ - groupRef.current.position.z, 2)
    );
    
    // Use exponential smoothing for ultra-smooth interpolation
    const baseLerp = 12;
    const distanceBoost = Math.min(distanceToTarget * 2, 8); // Speed up when far behind
    const lerpFactor = Math.min(1, delta * (baseLerp + distanceBoost));

    // Smooth position interpolation with prediction
    const targetY = predictedY - 0.5; // Offset for model feet
    
    groupRef.current.position.x += (predictedX - groupRef.current.position.x) * lerpFactor;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * lerpFactor;
    groupRef.current.position.z += (predictedZ - groupRef.current.position.z) * lerpFactor;

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
    const wasMoving = isMovingRef.current;
    if (wasMoving) {
      movementThreshold.current = Math.max(0, movementThreshold.current - delta);
      if (moveDist < 0.0005 && movementThreshold.current <= 0) {
        isMovingRef.current = false;
      }
    } else {
      if (moveDist > 0.005) {
        isMovingRef.current = true;
        movementThreshold.current = 0.15; // Keep moving animation for at least 150ms
      }
    }
    
    // Only update React state when movement state actually changes
    if (wasMoving !== isMovingRef.current) {
      setIsMoving(isMovingRef.current);
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
