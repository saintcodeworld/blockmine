import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls, Float } from '@react-three/drei';
import { Suspense, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Pickaxe } from './Pickaxe';
import { MineCube } from './MineCube';

function Scene() {
  const cubes = useGameStore((state) => state.cubes);
  const selectedCubeId = useGameStore((state) => state.selectedCubeId);
  const setSelectedCube = useGameStore((state) => state.setSelectedCube);
  const mineCube = useGameStore((state) => state.mineCube);

  const handleMine = useCallback((cubeId: string) => {
    mineCube(cubeId);
  }, [mineCube]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#ffffff" />
      
      {/* Stars background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Cubes */}
      {cubes.map((cube) => (
        <Float key={cube.id} speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
          <MineCube
            cube={cube}
            isSelected={selectedCubeId === cube.id}
            onSelect={() => setSelectedCube(cube.id)}
            onMine={() => handleMine(cube.id)}
          />
        </Float>
      ))}
      
      {/* Pickaxe */}
      <Pickaxe />
      
      {/* Camera controls */}
      <OrbitControls 
        enableZoom={true}
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        autoRotate
        autoRotateSpeed={0.2}
      />
    </>
  );
}

export function GameScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
