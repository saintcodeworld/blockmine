import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { RegisterScreen } from '@/components/ui/RegisterScreen';
import { GameScene } from './GameScene';
import { GameHUD } from '@/components/ui/GameHUD';
import { GameChat } from '@/components/ui/GameChat';
import { Crosshair } from './Crosshair';
import { useAuth } from '@/hooks/useAuth';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';
import { SettingsMenu } from './SettingsMenu';

export function GameWorld() {
  const { user, getUsername } = useAuth();
  const username = getUsername();

  // Initialize player progress from database
  usePlayerProgress(user?.id, username);

  const isRegistered = useGameStore((state) => state.isRegistered);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  const [isChatFocused, setIsChatFocused] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const handleRequestPointerLock = useCallback(async () => {
    // Only lock pointer on the game container
    if (!document.pointerLockElement && gameContainerRef.current) {
      try {
        // Use promise-based API if available, fallback to callback
        const result = gameContainerRef.current.requestPointerLock();
        if (result instanceof Promise) {
          await result;
        }
        console.log('Pointer lock acquired');
      } catch (err) {
        console.error('Failed to acquire pointer lock:', err);
        // Fallback: manually set locked state for preview environments
        // that may not support pointer lock
        setIsPointerLocked(true);
      }
    }
  }, []);



  useEffect(() => {
    const handlePointerLockChange = () => {
      const isLocked = !!document.pointerLockElement;
      console.log('Pointer lock changed:', isLocked);
      setIsPointerLocked(isLocked);

      // If lock is lost (user pressed ESC), open settings menu immediately
      // This prevents the "Click to Play" screen from showing up first
      if (!isLocked) {
        setIsSettingsOpen(true);
      }
    };

    const handlePointerLockError = () => {
      console.warn('Pointer lock failed - enabling fallback mode');
      // Enable game anyway for environments that don't support pointer lock
      setIsPointerLocked(true);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, []);



  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Handle escape to exit pointer lock and toggle settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPointerLocked) {
          document.exitPointerLock();
        }
        setIsSettingsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPointerLocked]);

  if (!isRegistered) {
    return <RegisterScreen />;
  }

  return (
    <div className="w-full h-screen bg-[#101010] overflow-hidden">
      {/* Settings Menu Overlay */}
      <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Fullscreen Game Container */}
      <div
        ref={gameContainerRef}
        className="fixed inset-0 z-0 bg-black"
      >
        <div className="absolute inset-0">
          <GameScene onRequestPointerLock={handleRequestPointerLock} isPointerLocked={isPointerLocked} />
        </div>

        {isPointerLocked && <Crosshair />}

        <GameHUD isPointerLocked={isPointerLocked} />

        <GameChat
          isPointerLocked={isPointerLocked}
          onChatFocus={() => setIsChatFocused(true)}
          onChatBlur={() => setIsChatFocused(false)}
        />

        {/* Click to play overlay - Invisible but clickable */}
        {!isPointerLocked && !isSettingsOpen && (
          <div
            className="absolute inset-0 cursor-pointer z-10"
            onClick={handleRequestPointerLock}
          />
        )}
      </div>
    </div>
  );
}
