import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Suspense, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MineCube } from './MineCube';
import { FirstPersonController } from './FirstPersonController';
import { RemotePlayer } from './RemotePlayer';
import { Pickaxe } from './Pickaxe';
import { useMultiplayer } from '@/hooks/useMultiplayer';

function Scene() {
  const cubes = useGameStore((state) => state.cubes);
  const selectedCubeId = useGameStore((state) => state.selectedCubeId);
  const setSelectedCube = useGameStore((state) => state.setSelectedCube);
  const mineCube = useGameStore((state) => state.mineCube);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const { remotePlayers } = useMultiplayer();

  const handleMine = useCallback((cubeId: string) => {
    mineCube(cubeId);
  }, [mineCube]);

  const handlePositionChange = useCallback((position: [number, number, number], rotation: number) => {
    updatePlayerPosition(position, rotation);
  }, [updatePlayerPosition]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 50, 50]} intensity={1} castShadow />
      <pointLight position={[10, 20, 10]} intensity={0.8} color="#06b6d4" />
      <hemisphereLight args={['#87CEEB', '#1a1a2e', 0.5]} />
      
      <Stars radius={200} depth={100} count={5000} factor={6} saturation={0} fade speed={0.5} />
      
      {/* First person controller */}
      <FirstPersonController onPositionChange={handlePositionChange} />
      
      {/* Pickaxe (attached to camera) */}
      <Pickaxe />
      
      {/* Render remote players */}
      {remotePlayers.map((player) => (
        <RemotePlayer key={player.odocument} player={player} />
      ))}
      
      {/* Render cubes */}
      {cubes.map((cube) => (
        <MineCube
          key={cube.id}
          cube={cube}
          isSelected={selectedCubeId === cube.id}
          onSelect={() => setSelectedCube(cube.id)}
          onMine={() => handleMine(cube.id)}
        />
      ))}
      
      {/* Ground plane for reference */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.5} />
      </mesh>
    </>
  );
}

interface GameSceneProps {
  onRequestPointerLock: () => void;
}

export function GameScene({ onRequestPointerLock }: GameSceneProps) {
  return (
    <div className="absolute inset-0" onClick={onRequestPointerLock}>
      <Canvas 
        camera={{ position: [0, 2, 10], fov: 75 }} 
        style={{ background: 'transparent' }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
