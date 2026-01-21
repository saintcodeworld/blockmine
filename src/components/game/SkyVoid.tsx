import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cloud, Clouds, Sky, Stars } from '@react-three/drei';
import { Group, Color } from 'three';

// Realistic Minecraft-style sky with day/night atmosphere
export function SkyVoid() {
  const cloudsRef = useRef<Group>(null);

  // Slowly rotate clouds for a dynamic feel
  useFrame((state) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = state.clock.elapsedTime * 0.003;
    }
  });

  // Generate realistic cloud positions
  const cloudPositions = useMemo(() => {
    const positions: Array<{ pos: [number, number, number]; scale: number; seed: number }> = [];
    const count = 30;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 40 + Math.random() * 100;
      const height = 50 + Math.random() * 30;
      
      positions.push({
        pos: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius,
        ],
        scale: 0.8 + Math.random() * 1.5,
        seed: Math.floor(Math.random() * 1000),
      });
    }
    
    return positions;
  }, []);

  return (
    <>
      {/* Realistic sky with proper sun position */}
      <Sky
        distance={450000}
        sunPosition={[150, 60, 100]}
        inclination={0.52}
        azimuth={0.25}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        rayleigh={0.8}
        turbidity={8}
      />

      {/* Stars for depth (visible in darker areas) */}
      <Stars
        radius={200}
        depth={100}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Main cloud layer */}
      <group ref={cloudsRef}>
        <Clouds material={undefined} limit={500} range={250}>
          {cloudPositions.map((cloud, i) => (
            <Cloud
              key={i}
              seed={cloud.seed}
              segments={25}
              bounds={[10, 3, 10]}
              volume={8}
              color="#ffffff"
              fade={120}
              speed={0.08}
              growth={3}
              opacity={0.9}
              position={cloud.pos}
              scale={cloud.scale}
            />
          ))}
        </Clouds>
      </group>

      {/* Lower cloud layer for depth */}
      <Clouds material={undefined} limit={200}>
        <Cloud
          seed={42}
          segments={40}
          bounds={[20, 4, 20]}
          volume={12}
          color="#f8f8ff"
          fade={100}
          speed={0.04}
          position={[40, 40, -60]}
          opacity={0.85}
        />
        <Cloud
          seed={123}
          segments={35}
          bounds={[18, 3, 18]}
          volume={10}
          color="#ffffff"
          fade={90}
          speed={0.06}
          position={[-60, 45, 40]}
          opacity={0.8}
        />
        <Cloud
          seed={456}
          segments={45}
          bounds={[25, 5, 25]}
          volume={15}
          color="#f0f4ff"
          fade={120}
          speed={0.02}
          position={[0, 55, -100]}
          opacity={0.85}
        />
        <Cloud
          seed={789}
          segments={30}
          bounds={[15, 3, 15]}
          volume={8}
          color="#fff"
          fade={80}
          speed={0.05}
          position={[-80, 48, -30]}
          opacity={0.75}
        />
      </Clouds>

      {/* Ground plane for void effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial 
          color="#1a472a" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Distant mountains/terrain silhouette */}
      <mesh position={[0, 10, -150]} receiveShadow>
        <coneGeometry args={[80, 40, 8]} />
        <meshStandardMaterial color="#2d3748" roughness={1} />
      </mesh>
      <mesh position={[-100, 8, -120]} receiveShadow>
        <coneGeometry args={[60, 30, 6]} />
        <meshStandardMaterial color="#374151" roughness={1} />
      </mesh>
      <mesh position={[120, 12, -140]} receiveShadow>
        <coneGeometry args={[70, 35, 7]} />
        <meshStandardMaterial color="#1f2937" roughness={1} />
      </mesh>

      {/* Atmospheric fog - realistic distance fade */}
      <fog attach="fog" args={['#a8c4e0', 60, 250]} />
    </>
  );
}
