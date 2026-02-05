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

// Remote player collision radius
const PLAYER_COLLISION_RADIUS = 0.6;

// Footstep interval based on speed
const FOOTSTEP_INTERVAL_WALK = 350;
const FOOTSTEP_INTERVAL_SPRINT = 220;

export function FirstPersonController({ onPositionChange, remotePlayers = [] }: FirstPersonControllerProps) {
  const { camera } = useThree();
  const updateMining = useGameStore((state) => state.updateMining);
  const checkRespawns = useGameStore((state) => state.checkRespawns);
  const cubes = useGameStore((state) => state.cubes);
  
  const { playFootstep } = useGameAudio();
  
  // Store cubes and remote players in refs to avoid stale closure issues
  const cubesRef = useRef(cubes);
  cubesRef.current = cubes;
  
  const remotePlayersRef = useRef(remotePlayers);
  remotePlayersRef.current = remotePlayers;
  
  // Get initial position from game store (supports random spawn)
  const player = useGameStore((state) => state.player);
  const initialPos = player?.position || [0, GROUND_LEVEL, 8];
  const position = useRef(new Vector3(initialPos[0], initialPos[1], initialPos[2]));
  const rotation = useRef({ x: 0, y: 0 });
  const velocity = useRef(new Vector3());
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(true);
  
  // Audio tracking
  const lastFootstepTime = useRef(0);
  const walkDistance = useRef(0);
  
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
  });
  
  const mouseMovement = useRef({ x: 0, y: 0 });

  // Check collision with remote players
  const checkPlayerCollision = (newPos: Vector3): boolean => {
    const players = remotePlayersRef.current;
    if (!players || players.length === 0) return false;

    for (const player of players) {
      const playerPos = new Vector3(...player.position);
      // Check horizontal distance only (ignore Y for simpler collision)
      const dx = newPos.x - playerPos.x;
      const dz = newPos.z - playerPos.z;
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
      
      // Check if within collision radius
      if (horizontalDistance < PLAYER_WIDTH + PLAYER_COLLISION_RADIUS) {
        // Also check vertical overlap
        const myBottom = newPos.y - PLAYER_HEIGHT;
        const myTop = newPos.y + 0.1;
        const theirBottom = playerPos.y - 0.5;
        const theirTop = playerPos.y + PLAYER_HEIGHT - 0.5;
        
        if (myBottom < theirTop && myTop > theirBottom) {
          return true; // Collision detected
        }
      }
    }
    return false;
  };

  // Check collision with cubes
  const checkCollision = (newPos: Vector3, currentVerticalVel: number): { canMove: boolean; groundY: number | null } => {
    const currentCubes = cubesRef.current;
    
    // First check player collision
    if (checkPlayerCollision(newPos)) {
      return { canMove: false, groundY: null };
    }
    
    if (!currentCubes || currentCubes.length === 0) {
      return { canMove: true, groundY: null };
    }

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

    for (const cube of currentCubes) {
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
        
        if (playerBottom >= cubeTop - 0.5 && currentVerticalVel <= 0) {
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

  // True when player is stuck between cubes (can't move in opposite directions)
  const isBetweenCubes = (pos: Vector3): boolean => {
    const probe = PLAYER_WIDTH + 0.2;
    const right = checkCollision(pos.clone().add(new Vector3(probe, 0, 0)), 0).canMove;
    const left = checkCollision(pos.clone().add(new Vector3(-probe, 0, 0)), 0).canMove;
    const forward = checkCollision(pos.clone().add(new Vector3(0, 0, -probe)), 0).canMove;
    const back = checkCollision(pos.clone().add(new Vector3(0, 0, probe)), 0).canMove;
    const betweenX = !right && !left;
    const betweenZ = !forward && !back;
    return betweenX || betweenZ;
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

  // Initialize camera
  useEffect(() => {
    camera.position.copy(position.current);
  }, [camera]);

  useFrame(() => {
    // Update mining progress (balance display only; real transfer on withdraw)
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
    const isSprinting = keys.current.sprint;

    if (keys.current.forward) moveDirection.z -= 1;
    if (keys.current.backward) moveDirection.z += 1;
    if (keys.current.left) moveDirection.x -= 1;
    if (keys.current.right) moveDirection.x += 1;

    const isMoving = moveDirection.length() > 0;
    
    if (isMoving) {
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

    // Footstep audio
    if (isMoving && isGrounded.current) {
      const now = Date.now();
      const interval = isSprinting ? FOOTSTEP_INTERVAL_SPRINT : FOOTSTEP_INTERVAL_WALK;
      
      if (now - lastFootstepTime.current > interval) {
        playFootstep();
        lastFootstepTime.current = now;
      }
    }

    // Jump
    if (keys.current.jump && isGrounded.current) {
      verticalVelocity.current = JUMP_FORCE;
      isGrounded.current = false;
    }

    // Gravity
    verticalVelocity.current -= GRAVITY;

    // Try horizontal movement with collision (skip if stuck between cubes)
    const newHorizontalPos = position.current.clone();
    newHorizontalPos.x += velocity.current.x;
    newHorizontalPos.z += velocity.current.z;

    const horizontalCheck = checkCollision(newHorizontalPos, verticalVelocity.current);
    const stuckBetweenCubes = isBetweenCubes(position.current);
    if (!stuckBetweenCubes && horizontalCheck.canMove) {
      position.current.x = newHorizontalPos.x;
      position.current.z = newHorizontalPos.z;
    } else if (!stuckBetweenCubes) {
      // Try X only
      const newXPos = position.current.clone();
      newXPos.x += velocity.current.x;
      if (checkCollision(newXPos, verticalVelocity.current).canMove) {
        position.current.x = newXPos.x;
      }
      
      // Try Z only
      const newZPos = position.current.clone();
      newZPos.z += velocity.current.z;
      if (checkCollision(newZPos, verticalVelocity.current).canMove) {
        position.current.z = newZPos.z;
      }
    }

    // Vertical movement
    const newVerticalPos = position.current.clone();
    newVerticalPos.y += verticalVelocity.current;

    const verticalCheck = checkCollision(newVerticalPos, verticalVelocity.current);
    
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
