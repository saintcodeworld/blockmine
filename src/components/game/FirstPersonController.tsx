import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Euler } from 'three';
import { usePlayerControls } from '@/hooks/usePlayerControls';

interface FirstPersonControllerProps {
  onPositionChange: (position: [number, number, number], rotation: number) => void;
}

const MOVE_SPEED = 0.15;
const SPRINT_MULTIPLIER = 1.8;
const MOUSE_SENSITIVITY = 0.002;
const VERTICAL_LIMIT = Math.PI / 2 - 0.1;

export function FirstPersonController({ onPositionChange }: FirstPersonControllerProps) {
  const { camera } = useThree();
  const { keys, isPointerLocked, getMouseMovement } = usePlayerControls();
  
  const position = useRef(new Vector3(0, 1.5, 5));
  const rotation = useRef({ x: 0, y: 0 });
  const velocity = useRef(new Vector3());

  useEffect(() => {
    camera.position.copy(position.current);
  }, [camera]);

  useFrame(() => {
    // Get mouse movement for looking
    if (isPointerLocked) {
      const mouseMovement = getMouseMovement();
      rotation.current.y -= mouseMovement.x * MOUSE_SENSITIVITY;
      rotation.current.x -= mouseMovement.y * MOUSE_SENSITIVITY;
      rotation.current.x = Math.max(-VERTICAL_LIMIT, Math.min(VERTICAL_LIMIT, rotation.current.x));
    }

    // Apply camera rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.x = rotation.current.x;
    camera.rotation.y = rotation.current.y;

    // Calculate movement direction
    const moveDirection = new Vector3();
    const speed = keys.sprint ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;

    if (keys.forward) moveDirection.z -= 1;
    if (keys.backward) moveDirection.z += 1;
    if (keys.left) moveDirection.x -= 1;
    if (keys.right) moveDirection.x += 1;

    // Normalize to prevent faster diagonal movement
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
    }

    // Apply rotation to movement direction (only Y rotation for ground movement)
    moveDirection.applyAxisAngle(new Vector3(0, 1, 0), rotation.current.y);

    // Update velocity with smoothing
    velocity.current.lerp(moveDirection.multiplyScalar(speed), 0.2);

    // Apply velocity to position
    position.current.add(velocity.current);

    // Apply camera position
    camera.position.copy(position.current);

    // Broadcast position update
    onPositionChange(
      [position.current.x, position.current.y, position.current.z],
      rotation.current.y
    );
  });

  return null;
}
