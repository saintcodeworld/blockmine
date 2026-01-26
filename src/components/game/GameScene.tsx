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
      
      {/* Realistic outdoor lighting */}
      <ambientLight intensity={0.4} color="#b4d4ff" />
      <directionalLight 
        position={[80, 120, 60]} 
        intensity={2} 
        castShadow 
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={300}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0001}
        color="#fff5e6"
      />
      {/* Fill light from opposite direction */}
      <directionalLight 
        position={[-50, 40, -50]} 
        intensity={0.3} 
        color="#a8c4e0"
      />
      <hemisphereLight args={['#87CEEB', '#3d5c34', 0.5]} />
      
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
