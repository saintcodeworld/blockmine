import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group } from 'three';
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

export function ThirdPersonController({ onPositionChange }: ThirdPersonControllerProps) {
  const { camera } = useThree();
  const updateMining = useGameStore((state) => state.updateMining);
  const checkRespawns = useGameStore((state) => state.checkRespawns);
  const isMining = useGameStore((state) => state.isMining);
  
  const playerRef = useRef<Group>(null);
  const position = useRef(new Vector3(0, GROUND_LEVEL, 8));
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
    // Update mining progress
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

    // Jump
    if (keys.current.jump && isGrounded.current) {
      verticalVelocity.current = JUMP_FORCE;
      isGrounded.current = false;
    }

    // Gravity
    verticalVelocity.current -= GRAVITY;

    // Apply movement
    position.current.x += velocity.current.x;
    position.current.z += velocity.current.z;
    position.current.y += verticalVelocity.current;

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
    <group ref={playerRef} position={[0, GROUND_LEVEL - 1.5, 8]}>
      <SteveModel isMoving={isMoving} isMining={isMining} />
    </group>
  );
}
