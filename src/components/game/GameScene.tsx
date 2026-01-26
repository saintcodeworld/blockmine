import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MineCube } from './MineCube';
import { FirstPersonController } from './FirstPersonController';
import { RemotePlayer } from './RemotePlayer';
import { FirstPersonHand } from './FirstPersonHand';
import { SkyVoid } from './SkyVoid';
import { CrosshairMining } from './CrosshairMining';
import { MiningParticles } from './MiningParticles';
import { useMultiplayer } from '@/hooks/useMultiplayer';

function Scene() {
  const cubes = useGameStore((state) => state.cubes);
  const selectedCubeId = useGameStore((state) => state.selectedCubeId);
  const setSelectedCube = useGameStore((state) => state.setSelectedCube);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const player = useGameStore((state) => state.player);
  const { remotePlayers, updatePosition, isConnected } = useMultiplayer();

  const handlePositionChange = useCallback((position: [number, number, number], rotation: number) => {
    updatePlayerPosition(position, rotation);
    if (isConnected) {
      updatePosition(position, rotation);
    }
  }, [updatePlayerPosition, updatePosition, isConnected]);

  const playerPosition: [number, number, number] = player?.position || [0, 2, 8];

  return (
    <>
      {/* Sky void with clouds and realistic environment */}
      <SkyVoid />
      
      {/* Warm, bright outdoor lighting */}
      <ambientLight intensity={0.6} color="#fffaf0" />
      <directionalLight 
        position={[100, 150, 80]} 
        intensity={2.5} 
        castShadow 
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={400}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0001}
        color="#fff8dc"
      />
      {/* Soft fill light */}
      <directionalLight 
        position={[-60, 50, -60]} 
        intensity={0.5} 
        color="#e0f0ff"
      />
      {/* Warm ground bounce */}
      <hemisphereLight args={['#87CEEB', '#4ade80', 0.7]} />
      {/* Subtle rim light */}
      <pointLight position={[0, 50, 0]} intensity={0.3} color="#fff5e6" />
      
      {/* First-person player controller with collision */}
      <FirstPersonController 
        onPositionChange={handlePositionChange} 
        remotePlayers={remotePlayers}
      />
      
      {/* Crosshair-based mining system */}
      <CrosshairMining />
      
      {/* First-person hand with pickaxe */}
      <FirstPersonHand />
      
      {/* Mining particle effects */}
      <MiningParticles />
      {/* Remote players with Steve models */}
      {remotePlayers.map((rplayer) => (
        <RemotePlayer key={rplayer.odocumentId || rplayer.odocument} player={rplayer} />
      ))}

      
      {/* Mineable cubes with shadows */}
      {cubes.map((cube) => (
        <MineCube
          key={cube.id}
          cube={cube}
          isSelected={selectedCubeId === cube.id}
          onSelect={() => setSelectedCube(cube.id)}
          playerPosition={playerPosition}
        />
      ))}
    </>
  );
}

interface GameSceneProps {
  onRequestPointerLock: () => void;
  isPointerLocked: boolean;
}

export function GameScene({ onRequestPointerLock, isPointerLocked }: GameSceneProps) {
  return (
    <Canvas 
      camera={{ position: [0, 2, 8], fov: 75, near: 0.1, far: 500 }} 
      style={{ 
        pointerEvents: isPointerLocked ? 'auto' : 'none' 
      }}
      gl={{ antialias: true, alpha: false }}
      shadows
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
