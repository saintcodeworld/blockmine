import { Canvas } from '@react-three/fiber';
import { Stars, PointerLockControls } from '@react-three/drei';
import { Suspense, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
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
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 50, 50]} intensity={1} />
      <pointLight position={[10, 20, 10]} intensity={0.8} color="#06b6d4" />
      <hemisphereLight args={['#87CEEB', '#1a1a2e', 0.5]} />
      
      <Stars radius={200} depth={100} count={5000} factor={6} saturation={0} fade speed={0.5} />
      
      {cubes.map((cube) => (
        <MineCube
          key={cube.id}
          cube={cube}
          isSelected={selectedCubeId === cube.id}
          onSelect={() => setSelectedCube(cube.id)}
          onMine={() => handleMine(cube.id)}
        />
      ))}
      
      <PointerLockControls />
    </>
  );
}

interface GameSceneProps {
  onRequestPointerLock: () => void;
}

export function GameScene({ onRequestPointerLock }: GameSceneProps) {
  return (
    <div className="absolute inset-0" onClick={onRequestPointerLock}>
      <Canvas camera={{ position: [0, 2, 10], fov: 75 }} style={{ background: 'transparent' }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
