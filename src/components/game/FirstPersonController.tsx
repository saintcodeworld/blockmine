import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Box3 } from 'three';
import { useGameStore } from '@/store/gameStore';
import { RemotePlayer } from '@/hooks/useMultiplayer';
import { useGameAudio } from '@/hooks/useGameAudio';

interface FirstPersonControllerProps {
  onPositionChange: (position: [number, number, number], rotation: number) => void;
  remotePlayers?: RemotePlayer[];
}

const MOVE_SPEED = 0.25; // Increased base speed for flying
const MOUSE_SENSITIVITY = 0.002;
const VERTICAL_LIMIT = Math.PI / 2 - 0.1;

// Player collision box (half-sizes)
const PLAYER_WIDTH = 0.4;
const PLAYER_HEIGHT = 1.8;

// Cube size for collision
const CUBE_SIZE = 1.8;

export function FirstPersonController({ onPositionChange, remotePlayers = [] }: FirstPersonControllerProps) {
  const { camera } = useThree();
  const updateMining = useGameStore((state) => state.updateMining);
  const checkRespawns = useGameStore((state) => state.checkRespawns);
  const { playFootstep } = useGameAudio();

  // Get initial position from game store (supports random spawn)
  const player = useGameStore((state) => state.player);
  const worldBounds = useGameStore((state) => state.worldBounds);
  const initialPos = player?.position || [0, 10, 8]; // Start higher up
  const position = useRef(new Vector3(initialPos[0], initialPos[1], initialPos[2]));
  const rotation = useRef({ x: 0, y: 0 });
  const velocity = useRef(new Vector3());
  const verticalVelocity = useRef(0);

  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  });

  const mouseMovement = useRef({ x: 0, y: 0 });

  const getCubeAt = useGameStore((state) => state.getCubeAt);

  // Check collision with cubes
  const checkCollision = (newPos: Vector3): boolean => {
    const playerMin = new Vector3(
      newPos.x - PLAYER_WIDTH,
      newPos.y - PLAYER_HEIGHT,
      newPos.z - PLAYER_WIDTH
    );
    const playerMax = new Vector3(
      newPos.x + PLAYER_WIDTH,
      newPos.y + 0.1,
      newPos.z + PLAYER_WIDTH
    );
    const playerBox = new Box3(playerMin, playerMax);

    // Grid traversal optimization
    const startX = Math.floor((playerMin.x - 1) / 2);
    const endX = Math.ceil((playerMax.x + 1) / 2);
    const startY = Math.floor((playerMin.y - 1) / 2);
    const endY = Math.ceil((playerMax.y + 1) / 2);
    const startZ = Math.floor((playerMin.z - 1) / 2);
    const endZ = Math.ceil((playerMax.z + 1) / 2);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        for (let z = startZ; z <= endZ; z++) {
          const cx = x * 2;
          const cy = y * 2;
          const cz = z * 2;

          const cube = getCubeAt(cx, cy, cz);
          if (!cube) continue;

          const cubePos = new Vector3(cx, cy, cz);
          const halfSize = CUBE_SIZE / 2;
          const cubeMin = new Vector3(
            cubePos.x - halfSize,
            cubePos.y - halfSize,
            cubePos.z - halfSize
          );
          const cubeMax = new Vector3(
            cubePos.x + halfSize,
            cubePos.y + halfSize,
            cubePos.z + halfSize
          );
          const cubeBox = new Box3(cubeMin, cubeMax);

          if (playerBox.intersectsBox(cubeBox)) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.forward = true; break;
        case 'KeyS': case 'ArrowDown': keys.current.backward = true; break;
        case 'KeyA': case 'ArrowLeft': keys.current.left = true; break;
        case 'KeyD': case 'ArrowRight': keys.current.right = true; break;
        case 'Space': keys.current.up = true; break;
        case 'ShiftLeft': case 'ShiftRight': keys.current.down = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.forward = false; break;
        case 'KeyS': case 'ArrowDown': keys.current.backward = false; break;
        case 'KeyA': case 'ArrowLeft': keys.current.left = false; break;
        case 'KeyD': case 'ArrowRight': keys.current.right = false; break;
        case 'Space': keys.current.up = false; break;
        case 'ShiftLeft': case 'ShiftRight': keys.current.down = false; break;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement || e.buttons === 1) {
        mouseMovement.current.x += e.movementX;
        mouseMovement.current.y += e.movementY;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Initialize camera
  useEffect(() => {
    camera.position.copy(position.current);
  }, [camera]);

  useFrame(() => {
    // Update mining progress
    updateMining();
    checkRespawns();

    // Mouse look
    if (document.pointerLockElement) {
      rotation.current.y -= mouseMovement.current.x * MOUSE_SENSITIVITY;
      rotation.current.x -= mouseMovement.current.y * MOUSE_SENSITIVITY;
      rotation.current.x = Math.max(-VERTICAL_LIMIT, Math.min(VERTICAL_LIMIT, rotation.current.x));
    }
    mouseMovement.current = { x: 0, y: 0 };

    // Apply rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.x = rotation.current.x;
    camera.rotation.y = rotation.current.y;

    // Movement
    const moveDirection = new Vector3();
    const speed = MOVE_SPEED;

    if (keys.current.forward) moveDirection.z -= 1;
    if (keys.current.backward) moveDirection.z += 1;
    if (keys.current.left) moveDirection.x -= 1;
    if (keys.current.right) moveDirection.x += 1;

    // Normalize horizontal movement
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
    }

    // Apply camera rotation to movement vector
    moveDirection.applyAxisAngle(new Vector3(0, 1, 0), rotation.current.y);

    // Apply smooth acceleration/deceleration
    velocity.current.x += (moveDirection.x * speed - velocity.current.x) * 0.1;
    velocity.current.z += (moveDirection.z * speed - velocity.current.z) * 0.1;

    // Vertical movement (Flying)
    let targetVerticalSpeed = 0;
    if (keys.current.up) targetVerticalSpeed = speed;
    if (keys.current.down) targetVerticalSpeed = -speed;

    verticalVelocity.current += (targetVerticalSpeed - verticalVelocity.current) * 0.1;

    // Calculate next position
    const nextPos = position.current.clone();
    nextPos.x += velocity.current.x;
    nextPos.y += verticalVelocity.current;
    nextPos.z += velocity.current.z;

    // Simple collision check - revert if hitting something
    // For flying, we check all axes at once to prevent getting stuck
    if (checkCollision(nextPos)) {
      position.current.copy(nextPos);
    } else {
      // Try sliding along axes if direct path is blocked
      // Try X
      const tryX = position.current.clone();
      tryX.x += velocity.current.x;
      if (checkCollision(tryX)) position.current.x = tryX.x;

      // Try Y
      const tryY = position.current.clone();
      tryY.y += verticalVelocity.current;
      if (checkCollision(tryY)) position.current.y = tryY.y;

      // Try Z
      const tryZ = position.current.clone();
      tryZ.z += velocity.current.z;
      if (checkCollision(tryZ)) position.current.z = tryZ.z;
    }

    // World Boundary Check
    if (position.current.x < worldBounds.minX) position.current.x = worldBounds.minX;
    if (position.current.x > worldBounds.maxX) position.current.x = worldBounds.maxX;
    if (position.current.z < worldBounds.minZ) position.current.z = worldBounds.minZ;
    if (position.current.z > worldBounds.maxZ) position.current.z = worldBounds.maxZ;

    // Prevent going under the world (Ground check)
    // Minimally keeping player above Y=0 (feet position)
    if (position.current.y < PLAYER_HEIGHT) {
      position.current.y = PLAYER_HEIGHT;
      verticalVelocity.current = 0;
    }

    // Update camera position
    camera.position.copy(position.current);

    onPositionChange(
      [position.current.x, position.current.y, position.current.z],
      rotation.current.y
    );
  });

  return null;
}
