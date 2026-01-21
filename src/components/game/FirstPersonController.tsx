import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
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

export function FirstPersonController({ onPositionChange }: FirstPersonControllerProps) {
  const { camera, gl } = useThree();
  const updateMining = useGameStore((state) => state.updateMining);
  const checkRespawns = useGameStore((state) => state.checkRespawns);
  
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
      if (document.pointerLockElement) {
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

    camera.position.copy(position.current);

    onPositionChange(
      [position.current.x, position.current.y, position.current.z],
      rotation.current.y
    );
  });

  return null;
}
