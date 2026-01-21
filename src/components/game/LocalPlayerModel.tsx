import { useRef } from 'react';
import { Group } from 'three';

interface LocalPlayerModelProps {
  position: [number, number, number];
  rotation: number;
}

// This component is hidden in first person but useful for debugging
// Remote players will see your Steve model through RemotePlayer component
export function LocalPlayerModel({ position, rotation }: LocalPlayerModelProps) {
  const groupRef = useRef<Group>(null);

  // In first person, we don't render the local player model
  // The model is visible to other players via the multiplayer sync
  return null;
}
