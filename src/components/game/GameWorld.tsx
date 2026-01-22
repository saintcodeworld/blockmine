import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { RegisterScreen } from '@/components/ui/RegisterScreen';
import { GameScene } from './GameScene';
import { GameHUD } from '@/components/ui/GameHUD';
import { Crosshair } from './Crosshair';
import { GameSidebar } from '@/components/ui/GameSidebar';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePlayerProgress } from '@/hooks/usePlayerProgress';

export function GameWorld() {
  const { user, getUsername } = useAuth();
  const username = getUsername();
  
  // Initialize player progress from database
  usePlayerProgress(user?.id, username);
  
  const isRegistered = useGameStore((state) => state.isRegistered);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await gameContainerRef.current?.requestFullscreen();
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Failed to exit fullscreen:', err);
      }
    }
  }, []);

  useEffect(() => {
    const handlePointerLockChange = () => {
      const isLocked = !!document.pointerLockElement;
      console.log('Pointer lock changed:', isLocked);
      setIsPointerLocked(isLocked);
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger fullscreen when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleFullscreen]);

  // Handle escape to exit pointer lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPointerLocked) {
        document.exitPointerLock();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPointerLocked]);

  if (!isRegistered) {
    return <RegisterScreen />;
  }

  return (
    <div className="w-full h-screen bg-background overflow-hidden">
      <div className="flex h-full">
        {!isFullscreen && <GameSidebar />}

        <div className="flex-1 flex flex-col p-4 gap-4 min-h-0">
          <div 
            ref={gameContainerRef}
            className={`relative overflow-hidden border-2 border-primary/30 shadow-2xl transition-all duration-300 ${
              isFullscreen 
                ? 'fixed inset-0 z-50 rounded-none border-0' 
                : 'flex-1 rounded-2xl'
            }`}
          >
            {/* Fullscreen toggle - high z-index, stops propagation */}
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleFullscreen();
              }}
              className="absolute top-4 right-4 z-[100] bg-background/80 backdrop-blur-sm hover:bg-primary/20 pointer-events-auto"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {/* Game canvas - enable pointer events when locked for mining */}
            <div className="absolute inset-0">
              <GameScene onRequestPointerLock={handleRequestPointerLock} isPointerLocked={isPointerLocked} />
            </div>
            
            {/* Crosshair */}
            {isPointerLocked && <Crosshair />}
            
            {/* HUD */}
            <GameHUD isPointerLocked={isPointerLocked} isFullscreen={isFullscreen} />

            {/* Click to play overlay - ONLY shows when not locked */}
            {!isPointerLocked && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer z-20"
                onClick={handleRequestPointerLock}
              >
                <div className="glass-card rounded-xl p-8 text-center max-w-lg animate-fade-in pointer-events-none">
                  <div className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.531 12.469 6.619 20.38a1 1 0 1 1-3-3l7.912-7.912"/>
                      <path d="M15.686 4.314A12.5 12.5 0 0 0 5.461 2.958 1 1 0 0 0 5.58 4.71a22 22 0 0 1 6.318 3.393"/>
                      <path d="M17.7 3.7a1 1 0 0 0-1.4 0l-4.6 4.6a1 1 0 0 0 0 1.4l2.6 2.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4z"/>
                      <path d="M19.686 8.314a12.5 12.5 0 0 1 1.356 10.225 1 1 0 0 1-1.751-.119 22 22 0 0 0-3.393-6.319"/>
                    </svg>
                  </div>
                  <h2 className="font-pixel text-2xl text-primary neon-text mb-6">CLICK TO PLAY</h2>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-6">
                    <div className="glass-card rounded-lg p-3">
                      <kbd className="px-2 py-1 bg-muted rounded text-foreground">WASD</kbd>
                      <p className="mt-1">Move</p>
                    </div>
                    <div className="glass-card rounded-lg p-3">
                      <kbd className="px-2 py-1 bg-muted rounded text-foreground">Mouse</kbd>
                      <p className="mt-1">Look</p>
                    </div>
                    <div className="glass-card rounded-lg p-3">
                      <kbd className="px-2 py-1 bg-muted rounded text-foreground">Hold Click</kbd>
                      <p className="mt-1">Mine Block</p>
                    </div>
                    <div className="glass-card rounded-lg p-3">
                      <kbd className="px-2 py-1 bg-muted rounded text-foreground">Space</kbd>
                      <p className="mt-1">Jump</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Press <kbd className="px-1.5 py-0.5 bg-muted rounded">ESC</kbd> to release cursor
                  </p>
                </div>
              </div>
            )}
          </div>

          {!isFullscreen && (
            <div className="glass-card rounded-xl p-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                Connected
              </div>
              <div className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded">F</kbd> for fullscreen
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
