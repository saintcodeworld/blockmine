import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cloud, Clouds, Sky } from '@react-three/drei';
import { Group } from 'three';

// Minecraft-style sky void with clouds
export function SkyVoid() {
  const cloudsRef = useRef<Group>(null);

  // Slowly rotate clouds for a dynamic feel
  useFrame((state) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = state.clock.elapsedTime * 0.005;
    }
  });

  // Generate cloud positions
  const cloudPositions = useMemo(() => {
    const positions: Array<{ pos: [number, number, number]; scale: number; seed: number }> = [];
    const count = 20;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 50 + Math.random() * 80;
      const height = 40 + Math.random() * 20;
      
      positions.push({
        pos: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius,
        ],
        scale: 0.5 + Math.random() * 1,
        seed: Math.floor(Math.random() * 1000),
      });
    }
    
    return positions;
  }, []);

  return (
    <>
      {/* Minecraft-style sky gradient */}
      <Sky
        distance={450000}
        sunPosition={[100, 50, 100]}
        inclination={0.6}
        azimuth={0.25}
        mieCoefficient={0.001}
        mieDirectionalG={0.8}
        rayleigh={0.5}
        turbidity={2}
      />

      {/* Volumetric clouds */}
      <group ref={cloudsRef}>
        <Clouds material={undefined} limit={400} range={200}>
          {cloudPositions.map((cloud, i) => (
            <Cloud
              key={i}
              seed={cloud.seed}
              segments={20}
              bounds={[8, 2, 8]}
              volume={6}
              color="#ffffff"
              fade={100}
              speed={0.1}
              growth={2}
              opacity={0.85}
              position={cloud.pos}
              scale={cloud.scale}
            />
          ))}
        </Clouds>
      </group>

      {/* Additional scattered clouds at different heights */}
      <Clouds material={undefined} limit={200}>
        <Cloud
          seed={42}
          segments={30}
          bounds={[15, 3, 15]}
          volume={8}
          color="#f0f8ff"
          fade={80}
          speed={0.05}
          position={[30, 35, -40]}
          opacity={0.7}
        />
        <Cloud
          seed={123}
          segments={25}
          bounds={[12, 2, 12]}
          volume={6}
          color="#ffffff"
          fade={80}
          speed={0.08}
          position={[-50, 45, 30]}
          opacity={0.75}
        />
        <Cloud
          seed={456}
          segments={35}
          bounds={[20, 3, 20]}
          volume={10}
          color="#f8fafc"
          fade={100}
          speed={0.03}
          position={[0, 50, -80]}
          opacity={0.8}
        />
      </Clouds>

      {/* Light fog for depth - matches sky blue */}
      <fog attach="fog" args={['#87CEEB', 80, 300]} />
    </>
  );
}
