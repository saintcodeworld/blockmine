import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group, Box3 } from 'three';
import { useGameStore } from '@/store/gameStore';
import { SteveModel } from './SteveModel';

interface ThirdPersonControllerProps {
  onPositionChange: (position: [number, number, number], rotation: number) => void;
}

const MOVE_SPEED = 0.12;
const SPRINT_MULTIPLIER = 1.8;
const MOUSE_SENSITIVITY = 0.002;
const VERTICAL_LIMIT = Math.PI / 3; // Limit vertical angle for third person
const GRAVITY = 0.012;
const JUMP_FORCE = 0.2;
const GROUND_LEVEL = 2;

// Camera offset behind and above the player
const CAMERA_DISTANCE = 5;
const CAMERA_HEIGHT = 2.5;

// Player and cube collision (match FirstPersonController)
const PLAYER_WIDTH = 0.4;
const PLAYER_HEIGHT = 1.8;
const CUBE_SIZE = 1.8;

export function ThirdPersonController({ onPositionChange }: ThirdPersonControllerProps) {
  const { camera } = useThree();
  const updateMining = useGameStore((state) => state.updateMining);
  const checkRespawns = useGameStore((state) => state.checkRespawns);
  const isMining = useGameStore((state) => state.isMining);
  const cubes = useGameStore((state) => state.cubes);
  const player = useGameStore((state) => state.player);
  
  const cubesRef = useRef(cubes);
  cubesRef.current = cubes;
  
  const playerRef = useRef<Group>(null);
  const initialPos = player?.position ?? [0, GROUND_LEVEL, 8];
  const position = useRef(new Vector3(initialPos[0], initialPos[1], initialPos[2]));
  const rotation = useRef({ x: 0.3, y: 0 }); // Slight downward angle
  const velocity = useRef(new Vector3());
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(true);
  const [isMoving, setIsMoving] = useState(false);
  
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
  const checkCollision = (newPos: Vector3, currentVerticalVel: number): { canMove: boolean; groundY: number | null } => {
    const currentCubes = cubesRef.current;
    if (!currentCubes?.length) return { canMove: true, groundY: null };

    const halfSize = CUBE_SIZE / 2;
    const playerMin = new Vector3(newPos.x - PLAYER_WIDTH, newPos.y - PLAYER_HEIGHT, newPos.z - PLAYER_WIDTH);
    const playerMax = new Vector3(newPos.x + PLAYER_WIDTH, newPos.y + 0.1, newPos.z + PLAYER_WIDTH);
    const playerBox = new Box3(playerMin, playerMax);
    let canMove = true;
    let groundY: number | null = null;

    for (const cube of currentCubes) {
      const cubePos = new Vector3(...cube.position);
      const cubeMin = new Vector3(cubePos.x - halfSize, cubePos.y - halfSize, cubePos.z - halfSize);
      const cubeMax = new Vector3(cubePos.x + halfSize, cubePos.y + halfSize, cubePos.z + halfSize);
      const cubeBox = new Box3(cubeMin, cubeMax);
      if (playerBox.intersectsBox(cubeBox)) {
        const playerBottom = newPos.y - PLAYER_HEIGHT;
        const cubeTop = cubePos.y + halfSize;
        if (playerBottom >= cubeTop - 0.5 && currentVerticalVel <= 0) {
          const newGroundY = cubeTop + PLAYER_HEIGHT;
          if (groundY === null || newGroundY > groundY) groundY = newGroundY;
        } else {
          canMove = false;
        }
      }
    }
    return { canMove, groundY };
  };

  const isBetweenCubes = (pos: Vector3): boolean => {
    const probe = PLAYER_WIDTH + 0.2;
    const right = checkCollision(pos.clone().add(new Vector3(probe, 0, 0)), 0).canMove;
    const left = checkCollision(pos.clone().add(new Vector3(-probe, 0, 0)), 0).canMove;
    const forward = checkCollision(pos.clone().add(new Vector3(0, 0, -probe)), 0).canMove;
    const back = checkCollision(pos.clone().add(new Vector3(0, 0, probe)), 0).canMove;
    return (!right && !left) || (!forward && !back);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore game controls when typing in inputs
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
        case 'Space': keys.current.jump = true; break;
        case 'ShiftLeft': case 'ShiftRight': keys.current.sprint = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Ignore game controls when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
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

  useFrame(() => {
    // Update mining progress (balance display only; real transfer on withdraw)
    updateMining();

    // Check for block respawns
    checkRespawns();

    // Mouse look - rotates camera around player
    if (document.pointerLockElement) {
      rotation.current.y -= mouseMovement.current.x * MOUSE_SENSITIVITY;
      rotation.current.x -= mouseMovement.current.y * MOUSE_SENSITIVITY;
      rotation.current.x = Math.max(-0.5, Math.min(VERTICAL_LIMIT, rotation.current.x));
    }
    mouseMovement.current = { x: 0, y: 0 };

    // Movement
    const moveDirection = new Vector3();
    const speed = keys.current.sprint ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;

    if (keys.current.forward) moveDirection.z -= 1;
    if (keys.current.backward) moveDirection.z += 1;
    if (keys.current.left) moveDirection.x -= 1;
    if (keys.current.right) moveDirection.x += 1;

    const moving = moveDirection.length() > 0;
    setIsMoving(moving);

    if (moving) {
      moveDirection.normalize();
    }

    moveDirection.applyAxisAngle(new Vector3(0, 1, 0), rotation.current.y);

    velocity.current.x += (moveDirection.x * speed - velocity.current.x) * 0.2;
    velocity.current.z += (moveDirection.z * speed - velocity.current.z) * 0.2;

    // When stuck between cubes, cannot move horizontally
    if (isBetweenCubes(position.current)) {
      velocity.current.x = 0;
      velocity.current.z = 0;
    }

    // Jump
    if (keys.current.jump && isGrounded.current) {
      verticalVelocity.current = JUMP_FORCE;
      isGrounded.current = false;
    }

    // Gravity
    verticalVelocity.current -= GRAVITY;

    // Apply horizontal movement with cube collision
    const newHorizontalPos = position.current.clone();
    newHorizontalPos.x += velocity.current.x;
    newHorizontalPos.z += velocity.current.z;
    const horizontalCheck = checkCollision(newHorizontalPos, verticalVelocity.current);
    const stuckBetweenCubes = isBetweenCubes(position.current);
    if (!stuckBetweenCubes && horizontalCheck.canMove) {
      position.current.x = newHorizontalPos.x;
      position.current.z = newHorizontalPos.z;
    } else if (!stuckBetweenCubes) {
      const newXPos = position.current.clone();
      newXPos.x += velocity.current.x;
      if (checkCollision(newXPos, verticalVelocity.current).canMove) position.current.x = newXPos.x;
      const newZPos = position.current.clone();
      newZPos.z += velocity.current.z;
      if (checkCollision(newZPos, verticalVelocity.current).canMove) position.current.z = newZPos.z;
    }

    // Vertical movement
    const newVerticalPos = position.current.clone();
    newVerticalPos.y += verticalVelocity.current;
    const verticalCheck = checkCollision(newVerticalPos, verticalVelocity.current);
    if (verticalCheck.groundY !== null) {
      position.current.y = verticalCheck.groundY;
      verticalVelocity.current = 0;
      isGrounded.current = true;
    } else if (verticalCheck.canMove) {
      position.current.y = newVerticalPos.y;
    } else if (verticalVelocity.current > 0) {
      verticalVelocity.current = 0;
    }

    // Ground collision
    if (position.current.y <= GROUND_LEVEL) {
      position.current.y = GROUND_LEVEL;
      verticalVelocity.current = 0;
      isGrounded.current = true;
    }

    // Update player model position and rotation
    if (playerRef.current) {
      playerRef.current.position.copy(position.current);
      playerRef.current.position.y -= 1.5; // Offset for model feet
      playerRef.current.rotation.y = rotation.current.y + Math.PI; // Face away from camera
    }

    // Position camera behind and above the player
    const cameraOffset = new Vector3(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
    cameraOffset.applyAxisAngle(new Vector3(1, 0, 0), rotation.current.x);
    cameraOffset.applyAxisAngle(new Vector3(0, 1, 0), rotation.current.y);
    
    const targetCameraPos = position.current.clone().add(cameraOffset);
    camera.position.lerp(targetCameraPos, 0.1);
    
    // Camera looks at the player
    const lookTarget = position.current.clone();
    lookTarget.y += 0.5; // Look at player's chest
    camera.lookAt(lookTarget);

    onPositionChange(
      [position.current.x, position.current.y, position.current.z],
      rotation.current.y
    );
  });

  return (
    <group ref={playerRef} position={[position.current.x, position.current.y - 1.5, position.current.z]}>
      <SteveModel isMoving={isMoving} isMining={isMining} />
    </group>
  );
}
