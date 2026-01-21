import { Canvas } from '@react-three/fiber';
import { Stars, PointerLockControls } from '@react-three/drei';
import { Suspense, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MineCube } from './MineCube';
import { FirstPersonController } from './FirstPersonController';
import { RemotePlayer } from './RemotePlayer';
import { PickaxeHUD } from './PickaxeHUD';
import { useMultiplayer } from '@/hooks/useMultiplayer';

function Scene() {
  const cubes = useGameStore((state) => state.cubes);
  const selectedCubeId = useGameStore((state) => state.selectedCubeId);
  const setSelectedCube = useGameStore((state) => state.setSelectedCube);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const { remotePlayers, updatePosition, isConnected } = useMultiplayer();

  const handlePositionChange = useCallback((position: [number, number, number], rotation: number) => {
    updatePlayerPosition(position, rotation);
    if (isConnected) {
      updatePosition(position, rotation);
    }
  }, [updatePlayerPosition, updatePosition, isConnected]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[50, 100, 50]} intensity={1} castShadow />
      <pointLight position={[0, 20, 0]} intensity={0.8} color="#06b6d4" />
      <hemisphereLight args={['#87CEEB', '#1a1a2e', 0.6]} />
      
      {/* Skybox */}
      <Stars radius={300} depth={100} count={3000} factor={4} saturation={0} fade speed={0.3} />
      
      {/* Player controller */}
      <FirstPersonController onPositionChange={handlePositionChange} />
      
      {/* Pickaxe in first-person view */}
      <PickaxeHUD />
      
      {/* Remote players */}
      {remotePlayers.map((player) => (
        <RemotePlayer key={player.odocument} player={player} />
      ))}
      
      {/* Mineable cubes */}
      {cubes.map((cube) => (
        <MineCube
          key={cube.id}
          cube={cube}
          isSelected={selectedCubeId === cube.id}
          onSelect={() => setSelectedCube(cube.id)}
        />
      ))}
      
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* Grid for orientation */}
      <gridHelper args={[100, 50, '#333', '#222']} position={[0, -0.99, 0]} />
    </>
  );
}

interface GameSceneProps {
  onRequestPointerLock: () => void;
}

export function GameScene({ onRequestPointerLock }: GameSceneProps) {
  const controlsRef = useRef<any>(null);

  return (
    <Canvas 
      camera={{ position: [0, 2, 8], fov: 75, near: 0.1, far: 1000 }} 
      style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)' }}
      gl={{ antialias: true }}
      shadows
      onClick={onRequestPointerLock}
    >
      <Suspense fallback={null}>
        <Scene />
        <PointerLockControls ref={controlsRef} />
      </Suspense>
    </Canvas>
  );
}
