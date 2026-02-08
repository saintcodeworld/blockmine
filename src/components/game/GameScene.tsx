import { Canvas } from '@react-three/fiber';
import { Suspense, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CubeWorld } from './CubeWorld';
import { FirstPersonController } from './FirstPersonController';
import { RemotePlayer } from './RemotePlayer';
import { FirstPersonHand } from './FirstPersonHand';
import { SkyVoid } from './SkyVoid';
import { CrosshairMining } from './CrosshairMining';
import { Wildlife } from './Wildlife';
import { DynamicLighting } from './DynamicLighting';
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

      {/* Animated wildlife */}
      <Wildlife />

      {/* Dynamic lighting based on time of day */}
      <DynamicLighting />

      {/* First-person player controller with collision */}
      <FirstPersonController
        onPositionChange={handlePositionChange}
        remotePlayers={remotePlayers}
      />

      {/* Crosshair-based mining system */}
      <CrosshairMining />

      {/* First-person hand with pickaxe */}
      <FirstPersonHand />

      {/* Remote players with Steve models */}
      {remotePlayers.map((rplayer) => (
        <RemotePlayer key={rplayer.odocumentId || rplayer.odocument} player={rplayer} />
      ))}


      {/* Mineable cubes with shadows */}
      {/* Optimized cube world rendering */}
      <CubeWorld playerPosition={playerPosition} />
    </>
  );
}

interface GameSceneProps {
  onRequestPointerLock: () => void;
  isPointerLocked: boolean;
}

export function GameScene({ onRequestPointerLock, isPointerLocked }: GameSceneProps) {
  const renderDistance = useGameStore((state) => state.renderDistance);

  const far = {
    low: 100,
    medium: 250,
    high: 500
  }[renderDistance];

  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 75, near: 0.1, far }}
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
