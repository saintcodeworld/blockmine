import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Color } from 'three';
import { Html } from '@react-three/drei';
import { RemotePlayer as RemotePlayerType } from '@/hooks/useMultiplayer';

interface RemotePlayerProps {
  player: RemotePlayerType;
}

export function RemotePlayer({ player }: RemotePlayerProps) {
  const groupRef = useRef<Group>(null);
  const targetPosition = useRef(player.position);
  const pickaxeRef = useRef<Group>(null);

  // Update target position when it changes
  targetPosition.current = player.position;

  useFrame(() => {
    if (!groupRef.current) return;

    // Smooth interpolation to target position
    groupRef.current.position.x += (targetPosition.current[0] - groupRef.current.position.x) * 0.1;
    groupRef.current.position.y += (targetPosition.current[1] - groupRef.current.position.y) * 0.1;
    groupRef.current.position.z += (targetPosition.current[2] - groupRef.current.position.z) * 0.1;

    // Apply rotation
    groupRef.current.rotation.y = player.rotation;

    // Mining animation
    if (pickaxeRef.current && player.isMining) {
      pickaxeRef.current.rotation.z = Math.sin(Date.now() * 0.03) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={player.position}>
      {/* Player body - Minecraft style */}
      <group>
        {/* Head */}
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial 
            color={player.color}
            emissive={new Color(player.color)}
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Body */}
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.5, 0.8, 0.3]} />
          <meshStandardMaterial color={player.color} />
        </mesh>

        {/* Left Arm */}
        <mesh position={[-0.4, 0.9, 0]}>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color={player.color} />
        </mesh>

        {/* Right Arm with Pickaxe */}
        <group ref={pickaxeRef} position={[0.4, 0.9, 0]}>
          <mesh>
            <boxGeometry args={[0.2, 0.8, 0.2]} />
            <meshStandardMaterial color={player.color} />
          </mesh>
          
          {/* Mini Pickaxe */}
          <group position={[0.3, -0.2, 0]} rotation={[0, 0, -0.5]} scale={0.2}>
            <mesh position={[0, -0.4, 0]}>
              <boxGeometry args={[0.15, 0.8, 0.15]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.6, 0.2, 0.1]} />
              <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.5} />
            </mesh>
          </group>
        </group>

        {/* Left Leg */}
        <mesh position={[-0.15, 0.3, 0]}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>

        {/* Right Leg */}
        <mesh position={[0.15, 0.3, 0]}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      </group>

      {/* Username label */}
      <Html position={[0, 2.2, 0]} center distanceFactor={10}>
        <div className="px-2 py-1 rounded bg-black/70 text-white text-xs font-pixel whitespace-nowrap">
          {player.username}
        </div>
      </Html>
    </group>
  );
}
