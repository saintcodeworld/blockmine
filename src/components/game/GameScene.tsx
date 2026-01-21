import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Suspense, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MineCube } from './MineCube';
import { FirstPersonController } from './FirstPersonController';
import { RemotePlayer } from './RemotePlayer';
import { FirstPersonHand } from './FirstPersonHand';
import { SteveModel } from './SteveModel';
import { SkyVoid } from './SkyVoid';
import { CrosshairMining } from './CrosshairMining';
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
      {/* Sky void with clouds */}
      <SkyVoid />
      
      {/* Lighting - adjusted for outdoor Minecraft feel */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        color="#fffbe6"
      />
      <hemisphereLight args={['#87CEEB', '#8B7355', 0.4]} />
      
      {/* First-person player controller */}
      <FirstPersonController onPositionChange={handlePositionChange} />
      
      {/* Crosshair-based mining system */}
      <CrosshairMining />
      
      {/* First-person hand with pickaxe */}
      <FirstPersonHand />
      
      {/* Remote players with Steve models */}
      {remotePlayers.map((rplayer) => (
        <RemotePlayer key={rplayer.odocument} player={rplayer} />
      ))}

      {/* Demo player for testing (shows a Steve at spawn) */}
      {remotePlayers.length === 0 && (
        <group position={[5, 0.5, 5]}>
          <SteveModel isMoving={false} isMining={false} />
          {/* Label */}
          <Html position={[0, 3, 0]} center distanceFactor={15}>
            <div className="px-2 py-1 bg-black/80 rounded text-white text-xs font-bold border border-cyan-500">
              Demo Player
            </div>
          </Html>
        </group>
      )}
      
      {/* Mineable cubes - pass player position for distance check */}
      {cubes.map((cube) => (
        <MineCube
          key={cube.id}
          cube={cube}
          isSelected={selectedCubeId === cube.id}
          onSelect={() => setSelectedCube(cube.id)}
          playerPosition={playerPosition}
        />
      ))}
      
      {/* Ground plane - grass-like color */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#5a8f3e" />
      </mesh>

      {/* Grid for orientation - subtle */}
      <gridHelper args={[100, 50, '#4a7f2e', '#4a7f2e']} position={[0, -0.99, 0]} />
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
