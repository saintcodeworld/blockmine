import { Canvas } from '@react-three/fiber';
import { Stars, Html } from '@react-three/drei';
import { Suspense, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MineCube } from './MineCube';
import { FirstPersonController } from './FirstPersonController';
import { RemotePlayer } from './RemotePlayer';
import { PickaxeHUD } from './PickaxeHUD';
import { SteveModel } from './SteveModel';
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
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[0, 30, 0]} intensity={0.6} color="#ffffff" />
      <pointLight position={[-20, 15, -20]} intensity={0.4} color="#06b6d4" />
      <pointLight position={[20, 15, 20]} intensity={0.4} color="#a855f7" />
      <hemisphereLight args={['#87CEEB', '#1a1a2e', 0.5]} />
      
      {/* Skybox */}
      <Stars radius={300} depth={100} count={5000} factor={4} saturation={0} fade speed={0.2} />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#0a0a1a', 30, 100]} />
      
      {/* Player controller */}
      <FirstPersonController onPositionChange={handlePositionChange} />
      
      {/* Pickaxe in first-person view */}
      <PickaxeHUD />
      
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
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1e1e2e" />
      </mesh>

      {/* Grid for orientation */}
      <gridHelper args={[100, 50, '#2a2a3a', '#1a1a2a']} position={[0, -0.99, 0]} />
    </>
  );
}

interface GameSceneProps {
  onRequestPointerLock: () => void;
}

export function GameScene({ onRequestPointerLock }: GameSceneProps) {
  return (
    <Canvas 
      camera={{ position: [0, 2, 8], fov: 75, near: 0.1, far: 500 }} 
      style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)', pointerEvents: 'none' }}
      gl={{ antialias: true, alpha: false }}
      shadows
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
