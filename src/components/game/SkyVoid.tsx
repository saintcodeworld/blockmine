import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cloud, Clouds, Stars } from '@react-three/drei';
import { Group, Color } from 'three';
import { useDayNightCycle } from '@/hooks/useDayNightCycle';

// Beautiful sky with day/night cycle based on local time
export function SkyVoid() {
  const cloudsRef = useRef<Group>(null);
  const timeOfDay = useDayNightCycle();

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

  // Cloud color based on time of day
  const cloudColor = useMemo(() => {
    switch (timeOfDay.phase) {
      case 'dawn': return '#ffb3a7';
      case 'dusk': return '#ff9999';
      case 'night': return '#4a5568';
      default: return '#ffffff';
    }
  }, [timeOfDay.phase]);

  // Grass color darkens at night
  const grassColor = useMemo(() => {
    const dayColor = new Color('#4ade80');
    const nightColor = new Color('#1a4d30');
    const t = timeOfDay.phase === 'night' ? 1 : timeOfDay.phase === 'dusk' ? 0.5 : 0;
    return dayColor.lerp(nightColor, t);
  }, [timeOfDay.phase]);

  const grassRingColor = useMemo(() => {
    const dayColor = new Color('#22c55e');
    const nightColor = new Color('#134d2e');
    const t = timeOfDay.phase === 'night' ? 1 : timeOfDay.phase === 'dusk' ? 0.5 : 0;
    return dayColor.lerp(nightColor, t);
  }, [timeOfDay.phase]);

  // Hill colors
  const hillColors = useMemo(() => {
    const t = timeOfDay.phase === 'night' ? 0.6 : timeOfDay.phase === 'dusk' ? 0.3 : 0;
    return [
      new Color('#16a34a').lerp(new Color('#0a3d1f'), t),
      new Color('#15803d').lerp(new Color('#093019'), t),
      new Color('#166534').lerp(new Color('#082515'), t),
    ];
  }, [timeOfDay.phase]);

  return (
    <>
      {/* Dynamic sky gradient background */}
      <color attach="background" args={[timeOfDay.skyColor]} />

      {/* Stars - visible at night and dusk */}
      <Stars
        radius={300}
        depth={80}
        count={3000}
        factor={4}
        saturation={0.3}
        fade
        speed={0.2}
      />

      {/* Moon at night */}
      {(timeOfDay.phase === 'night' || timeOfDay.phase === 'dusk') && (
        <mesh position={[-80, 100, -50]}>
          <sphereGeometry args={[8, 32, 32]} />
          <meshBasicMaterial color="#fffacd" />
        </mesh>
      )}

      {/* Sun glow during dawn/day/dusk */}
      {timeOfDay.phase !== 'night' && (
        <mesh position={timeOfDay.sunPosition}>
          <sphereGeometry args={[12, 32, 32]} />
          <meshBasicMaterial 
            color={timeOfDay.phase === 'dawn' ? '#ffdd99' : timeOfDay.phase === 'dusk' ? '#ff6b4a' : '#fffde7'} 
            transparent 
            opacity={0.9}
          />
        </mesh>
      )}

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
              color={cloudColor}
              fade={100}
              speed={0.05}
              growth={4}
              opacity={timeOfDay.phase === 'night' ? 0.4 : 0.95}
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
          color={cloudColor}
          fade={120}
          speed={0.03}
          position={[50, 70, -80]}
          opacity={timeOfDay.phase === 'night' ? 0.3 : 0.9}
        />
        <Cloud
          seed={123}
          segments={30}
          bounds={[20, 4, 20]}
          volume={12}
          color={cloudColor}
          fade={100}
          speed={0.04}
          position={[-70, 65, 50]}
          opacity={timeOfDay.phase === 'night' ? 0.3 : 0.85}
        />
      </Clouds>

      {/* Beautiful grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[150, 64]} />
        <meshStandardMaterial 
          color={grassColor} 
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Darker grass ring for depth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <ringGeometry args={[100, 200, 64]} />
        <meshStandardMaterial 
          color={grassRingColor} 
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
            <meshStandardMaterial 
              color={timeOfDay.phase === 'night' ? '#0f3d1a' : '#228B22'} 
              roughness={0.8} 
            />
          </mesh>
          <mesh position={[0, tree.height + tree.radius * 0.8, 0]} castShadow>
            <sphereGeometry args={[tree.radius * 0.7, 8, 8]} />
            <meshStandardMaterial 
              color={timeOfDay.phase === 'night' ? '#134d22' : '#2d8f2d'} 
              roughness={0.8} 
            />
          </mesh>
        </group>
      ))}

      {/* Colorful flowers - glow slightly at night */}
      {flowers.map((flower, i) => (
        <mesh key={i} position={flower.pos} castShadow>
          <sphereGeometry args={[0.15, 6, 6]} />
          <meshStandardMaterial 
            color={flower.color} 
            roughness={0.5} 
            emissive={flower.color} 
            emissiveIntensity={timeOfDay.phase === 'night' ? 0.3 : 0.1} 
          />
        </mesh>
      ))}

      {/* Distant hills for horizon */}
      <mesh position={[0, 5, -120]} receiveShadow>
        <sphereGeometry args={[50, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hillColors[0]} roughness={1} />
      </mesh>
      <mesh position={[-80, 8, -100]} receiveShadow>
        <sphereGeometry args={[40, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hillColors[1]} roughness={1} />
      </mesh>
      <mesh position={[100, 6, -110]} receiveShadow>
        <sphereGeometry args={[45, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hillColors[2]} roughness={1} />
      </mesh>

      {/* Soft atmospheric fog for depth */}
      <fog attach="fog" args={[timeOfDay.fogColor, 80, 300]} />
    </>
  );
}
