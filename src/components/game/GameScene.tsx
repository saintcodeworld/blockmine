import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Suspense, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MineCube } from './MineCube';
import { FirstPersonController } from './FirstPersonController';
import { RemotePlayer } from './RemotePlayer';
import { Pickaxe } from './Pickaxe';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { LocalPlayerModel } from './LocalPlayerModel';

function Scene() {
  const cubes = useGameStore((state) => state.cubes);
  const selectedCubeId = useGameStore((state) => state.selectedCubeId);
  const setSelectedCube = useGameStore((state) => state.setSelectedCube);
  const mineCube = useGameStore((state) => state.mineCube);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const player = useGameStore((state) => state.player);
  const { remotePlayers, updatePosition, isConnected } = useMultiplayer();

  const handleMine = useCallback((cubeId: string) => {
    mineCube(cubeId);
  }, [mineCube]);

  const handlePositionChange = useCallback((position: [number, number, number], rotation: number) => {
    updatePlayerPosition(position, rotation);
    // Sync to multiplayer
    if (isConnected) {
      updatePosition(position, rotation);
    }
  }, [updatePlayerPosition, updatePosition, isConnected]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[50, 50, 50]} intensity={1.2} castShadow />
      <pointLight position={[10, 20, 10]} intensity={0.8} color="#06b6d4" />
      <pointLight position={[-10, 15, -10]} intensity={0.5} color="#a855f7" />
      <hemisphereLight args={['#87CEEB', '#1a1a2e', 0.6]} />
      
      <Stars radius={200} depth={100} count={3000} factor={4} saturation={0} fade speed={0.3} />
      
      {/* First person controller */}
      <FirstPersonController onPositionChange={handlePositionChange} />
      
      {/* Pickaxe (attached to camera) */}
      <Pickaxe />
      
      {/* Local player model (visible in third person only - for debugging spawn) */}
      {player && <LocalPlayerModel position={player.position} rotation={player.rotation} />}
      
      {/* Render remote players */}
      {remotePlayers.map((rPlayer) => (
        <RemotePlayer key={rPlayer.odocument} player={rPlayer} />
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
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.8} />
      </mesh>

      {/* Grid helper for orientation */}
      <gridHelper args={[100, 50, '#333', '#222']} position={[0, -1.99, 0]} />
    </>
  );
}

interface GameSceneProps {
  onRequestPointerLock: () => void;
}

export function GameScene({ onRequestPointerLock }: GameSceneProps) {
  return (
    <Canvas 
      camera={{ position: [0, 2, 10], fov: 75, near: 0.1, far: 1000 }} 
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
      shadows
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
