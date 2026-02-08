import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { useGameStore } from '@/store/gameStore';

// Minecraft-style first-person hand with diamond pickaxe
export function FirstPersonHand() {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();
  const isMining = useGameStore((state) => state.isMining);
  const swingRef = useRef(0);
  const targetSwing = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Position relative to camera
    const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

    // Base position offset (bottom-right of view)
    groupRef.current.position.copy(camera.position);
    groupRef.current.position.add(forward.multiplyScalar(0.6));
    groupRef.current.position.add(right.multiplyScalar(0.35));
    groupRef.current.position.add(up.multiplyScalar(-0.35));

    // Copy camera rotation as base
    groupRef.current.quaternion.copy(camera.quaternion);

    // Mining swing animation
    if (isMining) {
      targetSwing.current = Math.sin(state.clock.elapsedTime * 12) * 0.8;
    } else {
      targetSwing.current = 0;
    }

    // Smooth swing interpolation
    swingRef.current += (targetSwing.current - swingRef.current) * 0.3;

    // Apply swing rotation
    groupRef.current.rotateX(swingRef.current * 0.5);
    groupRef.current.rotateZ(-0.2 + swingRef.current * 0.3);

    // Fixed position - no idle bob

  });

  // Skin color matching Steve
  const skinColor = "#c4a47a";

  return (
    <group ref={groupRef}>
      {/* === ARM === */}
      <group position={[0, 0, 0]} rotation={[0.3, 0, 0.2]}>
        {/* Upper arm (sleeve) */}
        <mesh position={[0.08, 0.1, 0.15]}>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshStandardMaterial color="#00a8a8" />
        </mesh>

        {/* Forearm (skin) */}
        <mesh position={[0.08, -0.05, 0.1]}>
          <boxGeometry args={[0.11, 0.25, 0.11]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>

        {/* Hand (skin) */}
        <mesh position={[0.08, -0.18, 0.05]}>
          <boxGeometry args={[0.1, 0.08, 0.1]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>

      {/* === DIAMOND PICKAXE === */}
      <group position={[0.05, -0.15, -0.1]} rotation={[0.8, 0.3, 0.5]}>
        {/* Handle - oak wood style */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.35, 0.04]} />
          <meshStandardMaterial color="#8B5A2B" roughness={0.9} />
        </mesh>

        {/* Handle detail strip */}
        <mesh position={[0.021, 0, 0]}>
          <boxGeometry args={[0.005, 0.35, 0.042]} />
          <meshStandardMaterial color="#6B4423" roughness={0.9} />
        </mesh>

        {/* Pickaxe head - Diamond */}
        <group position={[0, 0.2, 0]}>
          {/* Main head block */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.22, 0.06, 0.04]} />
            <meshStandardMaterial
              color="#5fd4e8"
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>

          {/* Head highlight */}
          <mesh position={[0, 0.015, 0.021]}>
            <boxGeometry args={[0.18, 0.025, 0.005]} />
            <meshStandardMaterial
              color="#8cf4ff"
              metalness={0.4}
              roughness={0.3}
            />
          </mesh>

          {/* Left spike */}
          <mesh position={[-0.14, 0, 0]}>
            <boxGeometry args={[0.06, 0.04, 0.035]} />
            <meshStandardMaterial
              color="#4bc4d8"
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
          <mesh position={[-0.18, 0, 0]}>
            <boxGeometry args={[0.03, 0.03, 0.03]} />
            <meshStandardMaterial
              color="#3ab4c8"
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>

          {/* Right spike */}
          <mesh position={[0.14, 0, 0]}>
            <boxGeometry args={[0.06, 0.04, 0.035]} />
            <meshStandardMaterial
              color="#4bc4d8"
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
          <mesh position={[0.18, 0, 0]}>
            <boxGeometry args={[0.03, 0.03, 0.03]} />
            <meshStandardMaterial
              color="#3ab4c8"
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
