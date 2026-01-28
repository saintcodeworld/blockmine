import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Raycaster, Vector2 } from 'three';
import { useGameStore } from '@/store/gameStore';
import { useGameAudio } from '@/hooks/useGameAudio';

const MINING_REACH = 5;
const MINING_HIT_INTERVAL = 200; // Play hit sound every 200ms while mining

// Component to handle crosshair-based mining with raycasting
export function CrosshairMining() {
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const isMouseDown = useRef(false);
  const lastMiningHitTime = useRef(0);
  const prevCubeCount = useRef(0);
  
  const cubes = useGameStore((state) => state.cubes);
  const startMining = useGameStore((state) => state.startMining);
  const stopMining = useGameStore((state) => state.stopMining);
  const setSelectedCube = useGameStore((state) => state.setSelectedCube);
  const isMining = useGameStore((state) => state.isMining);
  const miningCubeId = useGameStore((state) => state.miningCubeId);
  const player = useGameStore((state) => state.player);

  const { playMiningHit, playBlockBreak, playTokenCollect } = useGameAudio();

  // Track cube destruction for sound effects
  useEffect(() => {
    if (prevCubeCount.current > 0 && cubes.length < prevCubeCount.current) {
      // A cube was destroyed - find which type it was
      // Play break sound (default to stone if we can't determine type)
      playBlockBreak('stone');
      playTokenCollect();
    }
    prevCubeCount.current = cubes.length;
  }, [cubes.length, playBlockBreak, playTokenCollect]);

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

    // Play mining hit sounds while mining
    if (isMining && miningCubeId) {
      const now = Date.now();
      if (now - lastMiningHitTime.current > MINING_HIT_INTERVAL) {
        playMiningHit();
        lastMiningHitTime.current = now;
      }
    }
  });

  return null;
}
