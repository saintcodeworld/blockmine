import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { RegisterScreen } from '@/components/ui/RegisterScreen';
import { GameScene } from './GameScene';
import { GameHUD } from '@/components/ui/GameHUD';
import { Crosshair } from './Crosshair';
import { GameSidebar } from '@/components/ui/GameSidebar';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GameWorld() {
  const isRegistered = useGameStore((state) => state.isRegistered);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const handleRequestPointerLock = useCallback(() => {
    // Only lock pointer on the game container, not the whole document
    if (!document.pointerLockElement && gameContainerRef.current) {
      gameContainerRef.current.requestPointerLock();
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
      // Check if our game container is the locked element
      const isLocked = document.pointerLockElement === gameContainerRef.current;
      setIsPointerLocked(isLocked);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
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

            {/* Game canvas - no pointer events, just rendering */}
            <div className="absolute inset-0">
              <GameScene onRequestPointerLock={handleRequestPointerLock} />
            </div>
            
            {/* Crosshair */}
            {isPointerLocked && <Crosshair />}
            
            {/* HUD */}
            <GameHUD isPointerLocked={isPointerLocked} isFullscreen={isFullscreen} />

            {/* Click to play overlay - ONLY shows when not locked AND registered */}
            {!isPointerLocked && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-20 pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequestPointerLock();
                }}
              >
                <div className="text-center text-white pointer-events-none">
                  <p className="text-lg font-semibold">Click to Play</p>
                  <p className="text-sm text-white/70">Press ESC to release cursor</p>
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
