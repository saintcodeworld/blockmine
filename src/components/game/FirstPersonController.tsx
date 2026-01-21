import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

interface FirstPersonControllerProps {
  onPositionChange: (position: [number, number, number], rotation: number) => void;
}

const MOVE_SPEED = 0.15;
const SPRINT_MULTIPLIER = 1.8;
const MOUSE_SENSITIVITY = 0.002;
const VERTICAL_LIMIT = Math.PI / 2 - 0.1;
const GRAVITY = 0.015;
const JUMP_FORCE = 0.25;
const GROUND_LEVEL = 1.5;

export function FirstPersonController({ onPositionChange }: FirstPersonControllerProps) {
  const { camera } = useThree();
  
  const position = useRef(new Vector3(0, GROUND_LEVEL, 5));
  const rotation = useRef({ x: 0, y: 0 });
  const velocity = useRef(new Vector3());
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(true);
  
  // Key states stored in refs for immediate access
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
  });
  
  const mouseMovement = useRef({ x: 0, y: 0 });

  // Set up keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for game keys to avoid scrolling
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true;
          break;
        case 'Space':
          keys.current.jump = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.sprint = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false;
          break;
        case 'Space':
          keys.current.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.sprint = false;
          break;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        mouseMovement.current.x += e.movementX;
        mouseMovement.current.y += e.movementY;
      }
    };

    // Use window level listeners with capture phase for reliability
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Initialize camera position
  useEffect(() => {
    camera.position.copy(position.current);
  }, [camera]);

  useFrame(() => {
    // Handle mouse look (only when pointer locked)
    if (document.pointerLockElement) {
      rotation.current.y -= mouseMovement.current.x * MOUSE_SENSITIVITY;
      rotation.current.x -= mouseMovement.current.y * MOUSE_SENSITIVITY;
      rotation.current.x = Math.max(-VERTICAL_LIMIT, Math.min(VERTICAL_LIMIT, rotation.current.x));
    }
    mouseMovement.current = { x: 0, y: 0 };

    // Apply camera rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.x = rotation.current.x;
    camera.rotation.y = rotation.current.y;

    // Calculate movement direction based on current key states
    const moveDirection = new Vector3();
    const speed = keys.current.sprint ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;

    if (keys.current.forward) moveDirection.z -= 1;
    if (keys.current.backward) moveDirection.z += 1;
    if (keys.current.left) moveDirection.x -= 1;
    if (keys.current.right) moveDirection.x += 1;

    // Normalize to prevent faster diagonal movement
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
    }

    // Apply Y rotation to movement direction (for ground movement)
    moveDirection.applyAxisAngle(new Vector3(0, 1, 0), rotation.current.y);

    // Update horizontal velocity with smoothing
    velocity.current.x += (moveDirection.x * speed - velocity.current.x) * 0.2;
    velocity.current.z += (moveDirection.z * speed - velocity.current.z) * 0.2;

    // Handle jumping
    if (keys.current.jump && isGrounded.current) {
      verticalVelocity.current = JUMP_FORCE;
      isGrounded.current = false;
    }

    // Apply gravity
    verticalVelocity.current -= GRAVITY;

    // Apply velocities to position
    position.current.x += velocity.current.x;
    position.current.z += velocity.current.z;
    position.current.y += verticalVelocity.current;

    // Ground collision
    if (position.current.y <= GROUND_LEVEL) {
      position.current.y = GROUND_LEVEL;
      verticalVelocity.current = 0;
      isGrounded.current = true;
    }

    // Update camera position
    camera.position.copy(position.current);

    // Broadcast position update
    onPositionChange(
      [position.current.x, position.current.y, position.current.z],
      rotation.current.y
    );
  });

  return null;
}
