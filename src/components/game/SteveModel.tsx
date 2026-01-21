import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

interface SteveModelProps {
  isMoving?: boolean;
  isMining?: boolean;
}

// Accurate Minecraft Steve model based on reference
export function SteveModel({ isMoving = false, isMining = false }: SteveModelProps) {
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Walking animation
    if (isMoving) {
      const swing = Math.sin(time * 10) * 0.6;
      if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
    } else {
      // Reset to idle
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.9;
      if (rightArmRef.current) {
        if (isMining) {
          rightArmRef.current.rotation.x = Math.sin(time * 12) * 0.8 - 0.5;
        } else {
          rightArmRef.current.rotation.x *= 0.9;
        }
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.9;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.9;
    }
  });

  // Colors matching the Minecraft Steve reference
  const skinColor = "#c4a47a"; // Tan skin
  const hairColor = "#3d2314"; // Dark brown hair
  const eyeColor = "#4040c0"; // Blue/purple eyes
  const eyeWhite = "#ffffff";
  const shirtColor = "#00a8a8"; // Cyan/teal shirt
  const pantsColor = "#3232cd"; // Blue pants
  const shoeColor = "#4a4a4a"; // Dark gray shoes

  return (
    <group scale={1.5}>
      {/* === HEAD === */}
      <group position={[0, 1.5, 0]}>
        {/* Head base - skin */}
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
        
        {/* Hair - top and back */}
        <mesh position={[0, 0.15, -0.05]}>
          <boxGeometry args={[0.52, 0.25, 0.52]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
        
        {/* Hair - sides */}
        <mesh position={[-0.2, 0, -0.1]}>
          <boxGeometry args={[0.15, 0.4, 0.35]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>
        <mesh position={[0.2, 0, -0.1]}>
          <boxGeometry args={[0.15, 0.4, 0.35]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>

        {/* Eyes - white part */}
        <mesh position={[-0.1, 0.05, 0.251]}>
          <boxGeometry args={[0.1, 0.08, 0.01]} />
          <meshStandardMaterial color={eyeWhite} />
        </mesh>
        <mesh position={[0.1, 0.05, 0.251]}>
          <boxGeometry args={[0.1, 0.08, 0.01]} />
          <meshStandardMaterial color={eyeWhite} />
        </mesh>

        {/* Eyes - pupils */}
        <mesh position={[-0.08, 0.05, 0.252]}>
          <boxGeometry args={[0.05, 0.06, 0.01]} />
          <meshStandardMaterial color={eyeColor} />
        </mesh>
        <mesh position={[0.12, 0.05, 0.252]}>
          <boxGeometry args={[0.05, 0.06, 0.01]} />
          <meshStandardMaterial color={eyeColor} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.02, 0.26]}>
          <boxGeometry args={[0.08, 0.08, 0.04]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>

        {/* Mouth area - slightly darker */}
        <mesh position={[0, -0.12, 0.251]}>
          <boxGeometry args={[0.2, 0.06, 0.01]} />
          <meshStandardMaterial color="#a08060" />
        </mesh>
      </group>

      {/* === BODY/TORSO === */}
      <mesh position={[0, 0.875, 0]}>
        <boxGeometry args={[0.5, 0.75, 0.25]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>

      {/* === LEFT ARM === */}
      <group ref={leftArmRef} position={[-0.375, 1.125, 0]}>
        {/* Sleeve part */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.25, 0.3, 0.25]} />
          <meshStandardMaterial color={shirtColor} />
        </mesh>
        {/* Skin part */}
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[0.25, 0.4, 0.25]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>

      {/* === RIGHT ARM === */}
      <group ref={rightArmRef} position={[0.375, 1.125, 0]}>
        {/* Sleeve part */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.25, 0.3, 0.25]} />
          <meshStandardMaterial color={shirtColor} />
        </mesh>
        {/* Skin part */}
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[0.25, 0.4, 0.25]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>

      {/* === LEFT LEG === */}
      <group ref={leftLegRef} position={[-0.125, 0.375, 0]}>
        <mesh position={[0, -0.19, 0]}>
          <boxGeometry args={[0.25, 0.75, 0.25]} />
          <meshStandardMaterial color={pantsColor} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.52, 0.02]}>
          <boxGeometry args={[0.26, 0.12, 0.28]} />
          <meshStandardMaterial color={shoeColor} />
        </mesh>
      </group>

      {/* === RIGHT LEG === */}
      <group ref={rightLegRef} position={[0.125, 0.375, 0]}>
        <mesh position={[0, -0.19, 0]}>
          <boxGeometry args={[0.25, 0.75, 0.25]} />
          <meshStandardMaterial color={pantsColor} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.52, 0.02]}>
          <boxGeometry args={[0.26, 0.12, 0.28]} />
          <meshStandardMaterial color={shoeColor} />
        </mesh>
      </group>
    </group>
  );
}
