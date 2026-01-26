import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';

interface ButterflyProps {
  startPosition: [number, number, number];
  color: string;
  speed: number;
  radius: number;
  wingSpeed: number;
}

function Butterfly({ startPosition, color, speed, radius, wingSpeed }: ButterflyProps) {
  const groupRef = useRef<Group>(null);
  const leftWingRef = useRef<Group>(null);
  const rightWingRef = useRef<Group>(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!groupRef.current || !leftWingRef.current || !rightWingRef.current) return;
    
    const t = state.clock.elapsedTime * speed + offset;
    
    // Gentle floating path
    groupRef.current.position.x = startPosition[0] + Math.sin(t) * radius;
    groupRef.current.position.y = startPosition[1] + Math.sin(t * 1.5) * 0.5 + Math.sin(t * 0.3) * 0.3;
    groupRef.current.position.z = startPosition[2] + Math.cos(t) * radius;
    
    // Face direction of movement
    groupRef.current.rotation.y = t + Math.PI / 2;
    
    // Wing flapping
    const wingAngle = Math.sin(state.clock.elapsedTime * wingSpeed) * 0.7;
    leftWingRef.current.rotation.z = wingAngle + 0.3;
    rightWingRef.current.rotation.z = -wingAngle - 0.3;
  });

  return (
    <group ref={groupRef} position={startPosition}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.03, 0.15, 4, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Left wing */}
      <group ref={leftWingRef} position={[0.05, 0, 0]}>
        <mesh position={[0.08, 0, 0]} rotation={[0.2, 0, 0]}>
          <planeGeometry args={[0.18, 0.12]} />
          <meshStandardMaterial 
            color={color} 
            side={2} 
            transparent 
            opacity={0.9}
            emissive={color}
            emissiveIntensity={0.2}
          />
        </mesh>
      </group>
      
      {/* Right wing */}
      <group ref={rightWingRef} position={[-0.05, 0, 0]}>
        <mesh position={[-0.08, 0, 0]} rotation={[0.2, 0, 0]}>
          <planeGeometry args={[0.18, 0.12]} />
          <meshStandardMaterial 
            color={color} 
            side={2} 
            transparent 
            opacity={0.9}
            emissive={color}
            emissiveIntensity={0.2}
          />
        </mesh>
      </group>
    </group>
  );
}

interface BirdProps {
  startPosition: [number, number, number];
  color: string;
  speed: number;
  radius: number;
  height: number;
}

function Bird({ startPosition, color, speed, radius, height }: BirdProps) {
  const groupRef = useRef<Group>(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);
  const wingPhase = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const t = state.clock.elapsedTime * speed + offset;
    wingPhase.current += delta * 8;
    
    // Soaring circular path
    groupRef.current.position.x = startPosition[0] + Math.sin(t) * radius;
    groupRef.current.position.y = height + Math.sin(t * 0.5) * 3;
    groupRef.current.position.z = startPosition[2] + Math.cos(t) * radius;
    
    // Face direction of movement
    groupRef.current.rotation.y = t + Math.PI / 2;
    groupRef.current.rotation.z = Math.sin(t) * 0.15;
  });

  const wingAngle = Math.sin(wingPhase.current) * 0.4;

  return (
    <group ref={groupRef} position={startPosition} scale={0.6}>
      {/* Simple V-shaped bird silhouette */}
      {/* Body */}
      <mesh>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Left wing */}
      <mesh position={[0, 0.05, 0.2]} rotation={[wingAngle, 0, 0.3]}>
        <boxGeometry args={[0.08, 0.02, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Right wing */}
      <mesh position={[0, 0.05, -0.2]} rotation={[-wingAngle, 0, -0.3]}>
        <boxGeometry args={[0.08, 0.02, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

export function Wildlife() {
  // Generate butterflies
  const butterflies = useMemo(() => {
    const colors = ['#ff6b9d', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8fd8', '#a855f7', '#f97316'];
    const items: Array<{
      pos: [number, number, number];
      color: string;
      speed: number;
      radius: number;
      wingSpeed: number;
    }> = [];
    
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 8 + Math.random() * 25;
      
      items.push({
        pos: [
          Math.cos(angle) * distance,
          1 + Math.random() * 3,
          Math.sin(angle) * distance,
        ],
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 0.3 + Math.random() * 0.4,
        radius: 1 + Math.random() * 2,
        wingSpeed: 15 + Math.random() * 10,
      });
    }
    
    return items;
  }, []);

  // Generate birds
  const birds = useMemo(() => {
    const colors = ['#1e3a5f', '#4a5568', '#2d3748', '#1a202c', '#553c9a'];
    const items: Array<{
      pos: [number, number, number];
      color: string;
      speed: number;
      radius: number;
      height: number;
    }> = [];
    
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 40;
      
      items.push({
        pos: [
          Math.cos(angle) * distance,
          25 + Math.random() * 15,
          Math.sin(angle) * distance,
        ],
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 0.15 + Math.random() * 0.1,
        radius: 15 + Math.random() * 20,
        height: 20 + Math.random() * 20,
      });
    }
    
    return items;
  }, []);

  return (
    <group>
      {/* Butterflies */}
      {butterflies.map((butterfly, i) => (
        <Butterfly
          key={`butterfly-${i}`}
          startPosition={butterfly.pos}
          color={butterfly.color}
          speed={butterfly.speed}
          radius={butterfly.radius}
          wingSpeed={butterfly.wingSpeed}
        />
      ))}
      
      {/* Birds */}
      {birds.map((bird, i) => (
        <Bird
          key={`bird-${i}`}
          startPosition={bird.pos}
          color={bird.color}
          speed={bird.speed}
          radius={bird.radius}
          height={bird.height}
        />
      ))}
    </group>
  );
}
