import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Raycaster, Vector2, Mesh, InstancedMesh } from 'three';
import { useGameStore } from '@/store/gameStore';
import { useGameAudio } from '@/hooks/useGameAudio';

const MINING_REACH = 5;
const MINING_HIT_INTERVAL = 200;
const MINING_GRACE_FRAMES = 6;
const SELECTION_GRACE_FRAMES = 3;

export function CrosshairMining() {
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const isMouseDown = useRef(false);
  const lastMiningHitTime = useRef(0);
  const prevCubeCount = useRef(0);
  const missFrames = useRef(0);
  const lastHitCubeId = useRef<string | null>(null);

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
      // A cube was destroyed
      playBlockBreak('stone');
      playTokenCollect();
    }
    prevCubeCount.current = cubes.length;
  }, [cubes.length, playBlockBreak, playTokenCollect]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Work with pointer lock OR regardless if we decide to allow clicking without lock?
      // Usually only if locked.
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
    if (!player) return;

    raycaster.current.setFromCamera(new Vector2(0, 0), camera);

    // Improved candidate collection:
    // We only care about objects that look like our cubes.
    // Traversing entire scene is safer than assuming structure, but we limit depth or strict checks.
    const candidates: any[] = [];

    scene.traverse((object: any) => {
      // Collect InstancedMesh with cubeIds (our optimized cubes)
      if (object.isInstancedMesh && object.userData.cubeIds) {
        candidates.push(object);
      }
      // Collect standard meshes that are likely active cubes (MineCube)
      // They are usually children of a Group which represents the Cube.
      else if (object.isMesh && object.geometry?.type === 'BoxGeometry') {
        // Basic check to avoid picking up skybox or other boxes
        if (object.parent?.position) {
          candidates.push(object);
        }
      }
    });

    const intersects = raycaster.current.intersectObjects(candidates, false);

    // Find first valid hit within range
    let closestHit = null;
    let closestDistance = Infinity;
    let hitCubeId: string | null = null;

    for (const hit of intersects) {
      if (hit.distance > MINING_REACH) continue;

      if (hit.object instanceof InstancedMesh) {
        if (hit.instanceId !== undefined && hit.object.userData.cubeIds) {
          hitCubeId = hit.object.userData.cubeIds[hit.instanceId];
          closestDistance = hit.distance;
          closestHit = hit;
          break; // raycaster returns sorted by distance, so first valid is closest
        }
      } else if (hit.object instanceof Mesh) {
        // Check if this mesh corresponds to a cube
        const parentPos = hit.object.parent?.position;
        if (parentPos) {
          // Find cube matching position
          // This search is O(N) where N is mining/active cubes (very small)
          // OR naive Search over all cubes (O(M)).
          // Optimization: Only check active cubes? `cubes` is large.
          // But `candidates` (active meshes) is small.
          // We can find the cube in the global store.
          // To optimize, we can use a spatial hash or just accept O(N) since N=8000 is still fast enough for one frame? No.
          // 8000 checks per frame is bad.
          // BUT, we only do this if we HIT a Mesh. Mining hits are rare-ish (only when looking at one).
          // And we only search if we hit a box.

          // Better: Check if `cubes` has a cube at roughly this position.
          // Let's assume we can tolerate O(N) for now as typical "active" meshes are few (1-2).
          // Wait, ALL InstancedMesh instances are effectively treated as one object in raycast.
          // But this branch is for `Mesh`. Only a few `MineCube`s exist (1 at a time usually!).
          // So finding the ID for a `MineCube` is fast.

          const matchingCube = cubes.find(cube =>
            Math.abs(cube.position[0] - parentPos.x) < 0.1 &&
            Math.abs(cube.position[1] - parentPos.y) < 0.1 &&
            Math.abs(cube.position[2] - parentPos.z) < 0.1
          );

          if (matchingCube) {
            hitCubeId = matchingCube.id;
            closestDistance = hit.distance;
            closestHit = hit;
            break;
          }
        }
      }
    }

    if (hitCubeId) {
      missFrames.current = 0;
      lastHitCubeId.current = hitCubeId;

      if (miningCubeId !== hitCubeId) {
        setSelectedCube(hitCubeId);
      }

      if (isMouseDown.current) {
        if (!isMining || miningCubeId !== hitCubeId) {
          startMining(hitCubeId);
        }
      }
    } else {
      missFrames.current++;

      const gracePeriod = isMining ? MINING_GRACE_FRAMES : SELECTION_GRACE_FRAMES;

      if (missFrames.current > gracePeriod) {
        lastHitCubeId.current = null;
        setSelectedCube(null);
        if (isMining) stopMining();
      }
    }

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
