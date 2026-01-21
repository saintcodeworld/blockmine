import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Box3 } from 'three';
import { useGameStore } from '@/store/gameStore';

interface FirstPersonControllerProps {
  onPositionChange: (position: [number, number, number], rotation: number) => void;
}

const MOVE_SPEED = 0.12;
const SPRINT_MULTIPLIER = 1.8;
const MOUSE_SENSITIVITY = 0.002;
const VERTICAL_LIMIT = Math.PI / 2 - 0.1;
const GRAVITY = 0.012;
const JUMP_FORCE = 0.2;
const GROUND_LEVEL = 2;

// Player collision box (half-sizes)
const PLAYER_WIDTH = 0.4;
const PLAYER_HEIGHT = 1.8;

// Cube size for collision
const CUBE_SIZE = 1.8;

export function FirstPersonController({ onPositionChange }: FirstPersonControllerProps) {
  const { camera, gl } = useThree();
  const updateMining = useGameStore((state) => state.updateMining);
  const checkRespawns = useGameStore((state) => state.checkRespawns);
  const cubes = useGameStore((state) => state.cubes);
  
  const position = useRef(new Vector3(0, GROUND_LEVEL, 8));
  const rotation = useRef({ x: 0, y: 0 });
  const velocity = useRef(new Vector3());
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(true);
  
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
  });
  
  const mouseMovement = useRef({ x: 0, y: 0 });

  // Check collision with cubes
  const checkCollision = (newPos: Vector3): { canMove: boolean; groundY: number | null } => {
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

    let canMove = true;
    let groundY: number | null = null;

    for (const cube of cubes) {
      const cubePos = new Vector3(...cube.position);
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
        // Check if we're landing on top of the cube
        const playerBottom = newPos.y - PLAYER_HEIGHT;
        const cubeTop = cubePos.y + halfSize;
        
        if (playerBottom >= cubeTop - 0.3 && verticalVelocity.current <= 0) {
          // Landing on cube
          const newGroundY = cubeTop + PLAYER_HEIGHT;
          if (groundY === null || newGroundY > groundY) {
            groundY = newGroundY;
          }
        } else {
          // Side collision - can't move
          canMove = false;
        }
      }
    }

    return { canMove, groundY };
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.forward = true; break;
        case 'KeyS': case 'ArrowDown': keys.current.backward = true; break;
        case 'KeyA': case 'ArrowLeft': keys.current.left = true; break;
        case 'KeyD': case 'ArrowRight': keys.current.right = true; break;
        case 'Space': keys.current.jump = true; break;
        case 'ShiftLeft': case 'ShiftRight': keys.current.sprint = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.forward = false; break;
        case 'KeyS': case 'ArrowDown': keys.current.backward = false; break;
        case 'KeyA': case 'ArrowLeft': keys.current.left = false; break;
        case 'KeyD': case 'ArrowRight': keys.current.right = false; break;
        case 'Space': keys.current.jump = false; break;
        case 'ShiftLeft': case 'ShiftRight': keys.current.sprint = false; break;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Work with pointer lock OR when mouse button is held down for fallback mode
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
    
    // Check for block respawns
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
    const speed = keys.current.sprint ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;

    if (keys.current.forward) moveDirection.z -= 1;
    if (keys.current.backward) moveDirection.z += 1;
    if (keys.current.left) moveDirection.x -= 1;
    if (keys.current.right) moveDirection.x += 1;

    if (moveDirection.length() > 0) {
      moveDirection.normalize();
    }

    moveDirection.applyAxisAngle(new Vector3(0, 1, 0), rotation.current.y);

    velocity.current.x += (moveDirection.x * speed - velocity.current.x) * 0.2;
    velocity.current.z += (moveDirection.z * speed - velocity.current.z) * 0.2;

    // Jump
    if (keys.current.jump && isGrounded.current) {
      verticalVelocity.current = JUMP_FORCE;
      isGrounded.current = false;
    }

    // Gravity
    verticalVelocity.current -= GRAVITY;

    // Try horizontal movement with collision
    const newHorizontalPos = position.current.clone();
    newHorizontalPos.x += velocity.current.x;
    newHorizontalPos.z += velocity.current.z;

    const horizontalCheck = checkCollision(newHorizontalPos);
    if (horizontalCheck.canMove) {
      position.current.x = newHorizontalPos.x;
      position.current.z = newHorizontalPos.z;
    } else {
      // Try X only
      const newXPos = position.current.clone();
      newXPos.x += velocity.current.x;
      if (checkCollision(newXPos).canMove) {
        position.current.x = newXPos.x;
      }
      
      // Try Z only
      const newZPos = position.current.clone();
      newZPos.z += velocity.current.z;
      if (checkCollision(newZPos).canMove) {
        position.current.z = newZPos.z;
      }
    }

    // Vertical movement
    const newVerticalPos = position.current.clone();
    newVerticalPos.y += verticalVelocity.current;

    const verticalCheck = checkCollision(newVerticalPos);
    
    if (verticalCheck.groundY !== null) {
      // Land on block
      position.current.y = verticalCheck.groundY;
      verticalVelocity.current = 0;
      isGrounded.current = true;
    } else if (verticalCheck.canMove) {
      position.current.y = newVerticalPos.y;
    } else if (verticalVelocity.current > 0) {
      // Hit ceiling
      verticalVelocity.current = 0;
    }

    // Ground collision
    if (position.current.y <= GROUND_LEVEL) {
      position.current.y = GROUND_LEVEL;
      verticalVelocity.current = 0;
      isGrounded.current = true;
    }

    camera.position.copy(position.current);

    onPositionChange(
      [position.current.x, position.current.y, position.current.z],
      rotation.current.y
    );
  });

  return null;
}
