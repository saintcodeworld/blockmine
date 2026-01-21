import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

interface SteveModelProps {
  isMoving?: boolean;
  isMining?: boolean;
}

// Minecraft Steve-style player model
export function SteveModel({ isMoving = false, isMining = false }: SteveModelProps) {
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Walking animation
    if (isMoving) {
      const swing = Math.sin(time * 8) * 0.5;
      if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = swing;
    } else {
      // Reset to idle
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = isMining ? Math.sin(time * 15) * 0.7 : 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }

    // Mining animation for right arm
    if (isMining && rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.sin(time * 15) * 0.7 - 0.5;
    }
  });

  return (
    <group>
      {/* Head - 8x8x8 pixels in Minecraft = 0.5 units */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#c4a574" /> {/* Skin tone */}
      </mesh>
      
      {/* Hair (back of head) */}
      <mesh position={[0, 1.65, -0.13]}>
        <boxGeometry args={[0.52, 0.35, 0.26]} />
        <meshStandardMaterial color="#3d2314" /> {/* Dark brown hair */}
      </mesh>

      {/* Face features - Eyes */}
      <mesh position={[-0.1, 1.52, 0.251]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="#4169E1" /> {/* Blue eyes */}
      </mesh>
      <mesh position={[0.1, 1.52, 0.251]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color="#4169E1" />
      </mesh>

      {/* Body/Torso - Cyan shirt */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.5, 0.75, 0.25]} />
        <meshStandardMaterial color="#00CED1" /> {/* Cyan like Steve's shirt */}
      </mesh>

      {/* Left Arm - pivots from shoulder */}
      <group ref={leftArmRef} position={[-0.375, 1.125, 0]}>
        {/* Upper part - shirt sleeve */}
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.25, 0.4, 0.25]} />
          <meshStandardMaterial color="#00CED1" />
        </mesh>
        {/* Lower part - skin */}
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[0.25, 0.35, 0.25]} />
          <meshStandardMaterial color="#c4a574" />
        </mesh>
      </group>

      {/* Right Arm - pivots from shoulder */}
      <group ref={rightArmRef} position={[0.375, 1.125, 0]}>
        {/* Upper part - shirt sleeve */}
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.25, 0.4, 0.25]} />
          <meshStandardMaterial color="#00CED1" />
        </mesh>
        {/* Lower part - skin */}
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[0.25, 0.35, 0.25]} />
          <meshStandardMaterial color="#c4a574" />
        </mesh>
      </group>

      {/* Left Leg - Blue pants */}
      <group ref={leftLegRef} position={[-0.125, 0.375, 0]}>
        <mesh position={[0, -0.19, 0]}>
          <boxGeometry args={[0.25, 0.75, 0.25]} />
          <meshStandardMaterial color="#3232CD" /> {/* Blue pants */}
        </mesh>
      </group>

      {/* Right Leg - Blue pants */}
      <group ref={rightLegRef} position={[0.125, 0.375, 0]}>
        <mesh position={[0, -0.19, 0]}>
          <boxGeometry args={[0.25, 0.75, 0.25]} />
          <meshStandardMaterial color="#3232CD" />
        </mesh>
      </group>

      {/* Shoes/Feet */}
      <mesh position={[-0.125, -0.05, 0]}>
        <boxGeometry args={[0.26, 0.12, 0.26]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      <mesh position={[0.125, -0.05, 0]}>
        <boxGeometry args={[0.26, 0.12, 0.26]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
    </group>
  );
}
