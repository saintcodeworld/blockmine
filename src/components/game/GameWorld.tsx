import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { RegisterScreen } from '@/components/ui/RegisterScreen';
import { GameScene } from './GameScene';
import { GameHUD } from '@/components/ui/GameHUD';
import { Crosshair } from './Crosshair';

export function GameWorld() {
  const isRegistered = useGameStore((state) => state.isRegistered);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  const handleRequestPointerLock = useCallback(() => {
    if (!document.pointerLockElement) {
      document.body.requestPointerLock();
    }
  }, []);

  // Listen for pointer lock changes
  useEffect(() => {
    const handlePointerLockChange = () => {
      setIsPointerLocked(!!document.pointerLockElement);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  if (!isRegistered) {
    return <RegisterScreen />;
  }

  return (
    <div className="relative w-full h-screen void-bg overflow-hidden">
      <GameScene onRequestPointerLock={handleRequestPointerLock} />
      {isPointerLocked && <Crosshair />}
      <GameHUD isPointerLocked={isPointerLocked} />
    </div>
  );
}
