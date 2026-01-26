import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cloud, Clouds, Sky, Stars } from '@react-three/drei';
import { Group } from 'three';

// Beautiful family-friendly sky with warm daylight atmosphere
export function SkyVoid() {
  const cloudsRef = useRef<Group>(null);

  // Slowly rotate clouds for a dynamic feel
  useFrame((state) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = state.clock.elapsedTime * 0.002;
    }
  });

  // Generate fluffy cloud positions
  const cloudPositions = useMemo(() => {
    const positions: Array<{ pos: [number, number, number]; scale: number; seed: number }> = [];
    const count = 25;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 50 + Math.random() * 80;
      const height = 60 + Math.random() * 25;
      
      positions.push({
        pos: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius,
        ],
        scale: 1.2 + Math.random() * 1.8,
        seed: Math.floor(Math.random() * 1000),
      });
    }
    
    return positions;
  }, []);

  // Generate trees
  const trees = useMemo(() => {
    const treePositions: Array<{ pos: [number, number, number]; height: number; radius: number }> = [];
    
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 25 + Math.random() * 80;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      // Avoid spawn area
      if (Math.abs(x) < 8 && Math.abs(z - 8) < 8) continue;
      
      treePositions.push({
        pos: [x, 0, z],
        height: 4 + Math.random() * 6,
        radius: 2 + Math.random() * 2,
      });
    }
    
    return treePositions;
  }, []);

  // Generate flowers
  const flowers = useMemo(() => {
    const flowerPositions: Array<{ pos: [number, number, number]; color: string }> = [];
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8fd8', '#ffffff'];
    
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 5 + Math.random() * 60;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      // Avoid spawn area
      if (Math.abs(x) < 5 && Math.abs(z - 8) < 5) continue;
      
      flowerPositions.push({
        pos: [x, 0.15, z],
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    
    return flowerPositions;
  }, []);

  return (
    <>
      {/* Bright, cheerful sky */}
      <Sky
        distance={450000}
        sunPosition={[100, 80, 50]}
        inclination={0.6}
        azimuth={0.25}
        mieCoefficient={0.003}
        mieDirectionalG={0.7}
        rayleigh={0.5}
        turbidity={4}
      />

      {/* Subtle stars for depth */}
      <Stars
        radius={300}
        depth={80}
        count={2000}
        factor={3}
        saturation={0.2}
        fade
        speed={0.3}
      />

      {/* Main fluffy cloud layer */}
      <group ref={cloudsRef}>
        <Clouds material={undefined} limit={400} range={200}>
          {cloudPositions.map((cloud, i) => (
            <Cloud
              key={i}
              seed={cloud.seed}
              segments={30}
              bounds={[12, 4, 12]}
              volume={10}
              color="#ffffff"
              fade={100}
              speed={0.05}
              growth={4}
              opacity={0.95}
              position={cloud.pos}
              scale={cloud.scale}
            />
          ))}
        </Clouds>
      </group>

      {/* Secondary cloud layer */}
      <Clouds material={undefined} limit={150}>
        <Cloud
          seed={42}
          segments={35}
          bounds={[25, 5, 25]}
          volume={15}
          color="#fff8f0"
          fade={120}
          speed={0.03}
          position={[50, 70, -80]}
          opacity={0.9}
        />
        <Cloud
          seed={123}
          segments={30}
          bounds={[20, 4, 20]}
          volume={12}
          color="#ffffff"
          fade={100}
          speed={0.04}
          position={[-70, 65, 50]}
          opacity={0.85}
        />
      </Clouds>

      {/* Beautiful grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[150, 64]} />
        <meshStandardMaterial 
          color="#4ade80" 
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Darker grass ring for depth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <ringGeometry args={[100, 200, 64]} />
        <meshStandardMaterial 
          color="#22c55e" 
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Trees */}
      {trees.map((tree, i) => (
        <group key={i} position={tree.pos}>
          {/* Trunk */}
          <mesh position={[0, tree.height / 2, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.5, tree.height, 8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.9} />
          </mesh>
          {/* Leaves - layered for fullness */}
          <mesh position={[0, tree.height + tree.radius * 0.3, 0]} castShadow>
            <sphereGeometry args={[tree.radius, 8, 8]} />
            <meshStandardMaterial color="#228B22" roughness={0.8} />
          </mesh>
          <mesh position={[0, tree.height + tree.radius * 0.8, 0]} castShadow>
            <sphereGeometry args={[tree.radius * 0.7, 8, 8]} />
            <meshStandardMaterial color="#2d8f2d" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Colorful flowers */}
      {flowers.map((flower, i) => (
        <mesh key={i} position={flower.pos} castShadow>
          <sphereGeometry args={[0.15, 6, 6]} />
          <meshStandardMaterial color={flower.color} roughness={0.5} emissive={flower.color} emissiveIntensity={0.1} />
        </mesh>
      ))}

      {/* Distant hills for horizon */}
      <mesh position={[0, 5, -120]} receiveShadow>
        <sphereGeometry args={[50, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#16a34a" roughness={1} />
      </mesh>
      <mesh position={[-80, 8, -100]} receiveShadow>
        <sphereGeometry args={[40, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#15803d" roughness={1} />
      </mesh>
      <mesh position={[100, 6, -110]} receiveShadow>
        <sphereGeometry args={[45, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#166534" roughness={1} />
      </mesh>

      {/* Soft atmospheric fog for depth */}
      <fog attach="fog" args={['#87CEEB', 80, 300]} />
    </>
  );
}
