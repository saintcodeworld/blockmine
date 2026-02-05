import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { Vector3, Color } from 'three';
import { useGameStore } from '@/store/gameStore';

interface Particle {
  position: Vector3;
  velocity: Vector3;
  life: number;
  maxLife: number;
  color: Color;
  size: number;
  isSparkle: boolean;
}

interface ParticleEffect {
  id: string;
  particles: Particle[];
  startTime: number;
}

// Ore colors for debris
const ORE_COLORS: Record<string, string> = {
  stone: '#808080',
  gold: '#ffd700',
  diamond: '#00ffff',
  emerald: '#50c878',
  ruby: '#e0115f',
};

// Sparkle colors for rare ores
const SPARKLE_COLORS: Record<string, string[]> = {
  diamond: ['#00ffff', '#ffffff', '#87ceeb'],
  emerald: ['#50c878', '#98fb98', '#ffffff'],
  ruby: ['#e0115f', '#ff69b4', '#ffffff'],
  gold: ['#ffd700', '#ffec8b', '#ffffff'],
};

let effectIdCounter = 0;

export function MiningParticles() {
  const [effects, setEffects] = useState<ParticleEffect[]>([]);
  const lastMinedCube = useRef<string | null>(null);
  
  const cubes = useGameStore((state) => state.cubes);
  const destroyedCubes = useGameStore((state) => state.destroyedCubes);
  const isMining = useGameStore((state) => state.isMining);
  const miningCubeId = useGameStore((state) => state.miningCubeId);
  const miningStartTime = useGameStore((state) => state.miningStartTime);
  const MINING_TIME = useGameStore((state) => state.MINING_TIME);

  // Detect when a cube is destroyed
  useEffect(() => {
    if (destroyedCubes.length > 0) {
      const latestDestroyed = destroyedCubes[destroyedCubes.length - 1];
      if (latestDestroyed.id !== lastMinedCube.current) {
        lastMinedCube.current = latestDestroyed.id;
        spawnBreakEffect(latestDestroyed.position, latestDestroyed.type);
      }
    }
  }, [destroyedCubes]);

  // Spawn mining progress particles
  useEffect(() => {
    if (!isMining || !miningCubeId) return;

    const cube = cubes.find(c => c.id === miningCubeId);
    if (!cube) return;

    const interval = setInterval(() => {
      const progress = (Date.now() - miningStartTime) / MINING_TIME;
      if (progress > 0.2) {
        spawnMiningChips(cube.position, cube.type, Math.min(3, Math.floor(progress * 5)));
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isMining, miningCubeId, cubes, miningStartTime, MINING_TIME]);

  const spawnMiningChips = (position: [number, number, number], type: string, count: number) => {
    const particles: Particle[] = [];
    const baseColor = new Color(ORE_COLORS[type] || ORE_COLORS.stone);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.02 + Math.random() * 0.03;
      
      particles.push({
        position: new Vector3(
          position[0] + (Math.random() - 0.5) * 0.8,
          position[1] + (Math.random() - 0.5) * 0.8,
          position[2] + (Math.random() - 0.5) * 0.8
        ),
        velocity: new Vector3(
          Math.cos(angle) * speed,
          0.02 + Math.random() * 0.03,
          Math.sin(angle) * speed
        ),
        life: 1,
        maxLife: 0.5 + Math.random() * 0.3,
        color: baseColor.clone(),
        size: 0.05 + Math.random() * 0.05,
        isSparkle: false,
      });
    }

    setEffects(prev => [...prev, {
      id: `chip-${Date.now()}-${++effectIdCounter}`,
      particles,
      startTime: Date.now(),
    }]);
  };

  const spawnBreakEffect = (position: [number, number, number], type: string) => {
    const particles: Particle[] = [];
    const baseColor = new Color(ORE_COLORS[type] || ORE_COLORS.stone);
    const isRare = ['diamond', 'emerald', 'ruby', 'gold'].includes(type);
    const sparkleColors = SPARKLE_COLORS[type] || [];

    // Main debris particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const upAngle = Math.random() * Math.PI * 0.5;
      const speed = 0.05 + Math.random() * 0.1;
      
      particles.push({
        position: new Vector3(
          position[0] + (Math.random() - 0.5) * 0.5,
          position[1] + (Math.random() - 0.5) * 0.5,
          position[2] + (Math.random() - 0.5) * 0.5
        ),
        velocity: new Vector3(
          Math.cos(angle) * Math.cos(upAngle) * speed,
          Math.sin(upAngle) * speed * 1.5,
          Math.sin(angle) * Math.cos(upAngle) * speed
        ),
        life: 1,
        maxLife: 0.8 + Math.random() * 0.4,
        color: baseColor.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.3),
        size: 0.08 + Math.random() * 0.1,
        isSparkle: false,
      });
    }

    // Sparkle particles for rare ores
    if (isRare && sparkleColors.length > 0) {
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const upAngle = Math.random() * Math.PI * 0.7;
        const speed = 0.03 + Math.random() * 0.06;
        const sparkleColor = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
        
        particles.push({
          position: new Vector3(
            position[0] + (Math.random() - 0.5) * 0.3,
            position[1] + (Math.random() - 0.5) * 0.3,
            position[2] + (Math.random() - 0.5) * 0.3
          ),
          velocity: new Vector3(
            Math.cos(angle) * Math.cos(upAngle) * speed,
            Math.sin(upAngle) * speed * 2,
            Math.sin(angle) * Math.cos(upAngle) * speed
          ),
          life: 1,
          maxLife: 1.2 + Math.random() * 0.6,
          color: new Color(sparkleColor),
          size: 0.06 + Math.random() * 0.08,
          isSparkle: true,
        });
      }
    }

    setEffects(prev => [...prev, {
      id: `break-${Date.now()}-${++effectIdCounter}`,
      particles,
      startTime: Date.now(),
    }]);
  };

  // Update particles - mutate in place to avoid React re-renders
  useFrame((_, delta) => {
    let needsCleanup = false;
    
    for (const effect of effects) {
      for (const p of effect.particles) {
        // Apply gravity and velocity
        p.velocity.y -= 0.003;
        p.position.add(p.velocity);
        p.life -= delta / p.maxLife;
        
        // Sparkle particles float more
        if (p.isSparkle) {
          p.velocity.y += 0.001;
          p.velocity.x *= 0.98;
          p.velocity.z *= 0.98;
        }
      }
      
      // Check if any particles died
      const aliveCount = effect.particles.filter(p => p.life > 0).length;
      if (aliveCount < effect.particles.length) {
        effect.particles = effect.particles.filter(p => p.life > 0);
        needsCleanup = true;
      }
    }
    
    // Only update state when effects need to be removed entirely
    if (needsCleanup) {
      setEffects(prev => prev.filter(e => e.particles.length > 0));
    }
  });

  return (
    <>
      {effects.map(effect => (
        <ParticleCloud key={effect.id} particles={effect.particles} />
      ))}
    </>
  );
}

function ParticleCloud({ particles }: { particles: Particle[] }) {
  const pointsRef = useRef<any>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);
    const sizes = new Float32Array(particles.length);

    particles.forEach((p, i) => {
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
      
      // Fade out based on life
      const alpha = p.life;
      colors[i * 3] = p.color.r * alpha;
      colors[i * 3 + 1] = p.color.g * alpha;
      colors[i * 3 + 2] = p.color.b * alpha;
      
      // Sparkles pulse
      const sizeMod = p.isSparkle ? (0.8 + Math.sin(Date.now() * 0.01 + i) * 0.4) : 1;
      sizes[i] = p.size * p.life * sizeMod;
    });

    return { positions, colors, sizes };
  }, [particles]);

  useFrame(() => {
    if (!pointsRef.current) return;
    
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const colorAttr = geo.attributes.color;
    const sizeAttr = geo.attributes.size;

    particles.forEach((p, i) => {
      posAttr.array[i * 3] = p.position.x;
      posAttr.array[i * 3 + 1] = p.position.y;
      posAttr.array[i * 3 + 2] = p.position.z;
      
      const alpha = p.life;
      colorAttr.array[i * 3] = p.color.r * alpha;
      colorAttr.array[i * 3 + 1] = p.color.g * alpha;
      colorAttr.array[i * 3 + 2] = p.color.b * alpha;
      
      const sizeMod = p.isSparkle ? (0.8 + Math.sin(Date.now() * 0.01 + i) * 0.4) : 1;
      sizeAttr.array[i] = p.size * p.life * sizeMod;
    });

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  if (particles.length === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.length}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
