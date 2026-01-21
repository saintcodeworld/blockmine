import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Stars, Html } from '@react-three/drei';
import { Suspense, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { MineCube } from './MineCube';
import { FirstPersonController } from './FirstPersonController';
import { RemotePlayer } from './RemotePlayer';
import { PickaxeHUD } from './PickaxeHUD';
import { SteveModel } from './SteveModel';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { Raycaster, Vector2, Vector3 } from 'three';

const MINING_REACH = 5;

// Component to handle crosshair-based mining with raycasting
function CrosshairMining() {
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const isMouseDown = useRef(false);
  
  const cubes = useGameStore((state) => state.cubes);
  const startMining = useGameStore((state) => state.startMining);
  const stopMining = useGameStore((state) => state.stopMining);
  const setSelectedCube = useGameStore((state) => state.setSelectedCube);
  const isMining = useGameStore((state) => state.isMining);
  const player = useGameStore((state) => state.player);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && document.pointerLockElement) {
        isMouseDown.current = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown.current = false;
        stopMining();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [stopMining]);

  useFrame(() => {
    // Work in both pointer lock mode and fallback mode
    if (!player) return;

    // Raycast from camera center (crosshair)
    raycaster.current.setFromCamera(new Vector2(0, 0), camera);
    
    // Collect all cube meshes for raycasting
    const cubeMeshes: any[] = [];
    scene.traverse((object: any) => {
      // Look for meshes that are cubes (have boxGeometry and are in groups)
      if (object.type === 'Mesh' && object.geometry?.type === 'BoxGeometry') {
        const parent = object.parent;
        if (parent?.type === 'Group') {
          // Check if this is a mineable cube by checking parent position
          const parentPos = parent.position;
          const isCube = cubes.some(cube => 
            Math.abs(cube.position[0] - parentPos.x) < 0.1 &&
            Math.abs(cube.position[1] - parentPos.y) < 0.1 &&
            Math.abs(cube.position[2] - parentPos.z) < 0.1
          );
          if (isCube) {
            cubeMeshes.push(object);
          }
        }
      }
    });

    const intersects = raycaster.current.intersectObjects(cubeMeshes, false);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      const distance = hit.distance;
      
      if (distance <= MINING_REACH) {
        // Find which cube this mesh belongs to
        const hitPosition = hit.object.parent?.position;
        if (hitPosition) {
          const matchingCube = cubes.find(cube => 
            Math.abs(cube.position[0] - hitPosition.x) < 0.1 &&
            Math.abs(cube.position[1] - hitPosition.y) < 0.1 &&
            Math.abs(cube.position[2] - hitPosition.z) < 0.1
          );
          
          if (matchingCube) {
            setSelectedCube(matchingCube.id);
            
            if (isMouseDown.current && !isMining) {
              startMining(matchingCube.id);
            }
          }
        }
      } else {
        setSelectedCube(null);
      }
    } else {
      setSelectedCube(null);
    }
  });

  return null;
}

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
      
      {/* First-person player controller */}
      <FirstPersonController onPositionChange={handlePositionChange} />
      
      {/* Crosshair-based mining system */}
      <CrosshairMining />
      
      {/* Pickaxe and hand in first-person view */}
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
  isPointerLocked: boolean;
}

export function GameScene({ onRequestPointerLock, isPointerLocked }: GameSceneProps) {
  return (
    <Canvas 
      camera={{ position: [0, 2, 8], fov: 75, near: 0.1, far: 500 }} 
      style={{ 
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)', 
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
