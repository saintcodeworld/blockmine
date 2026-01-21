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
    if (!document.pointerLockElement) {
      document.body.requestPointerLock();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handlePointerLockChange = () => {
      setIsPointerLocked(!!document.pointerLockElement);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  if (!isRegistered) {
    return <RegisterScreen />;
  }

  return (
    <div className="w-full h-screen bg-background overflow-hidden">
      <div className="flex h-full">
        {!isFullscreen && <GameSidebar />}

        <div className="flex-1 flex flex-col p-4 gap-4">
          <div 
            ref={gameContainerRef}
            className={`relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl transition-all duration-300 ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'flex-1'
            }`}
          >
            {/* Fullscreen toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-primary/20"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {/* Game canvas */}
            <GameScene onRequestPointerLock={handleRequestPointerLock} />
            
            {/* Crosshair */}
            {isPointerLocked && <Crosshair />}
            
            {/* HUD */}
            <GameHUD isPointerLocked={isPointerLocked} isFullscreen={isFullscreen} />
          </div>

          {!isFullscreen && (
            <div className="glass-card rounded-xl p-3 flex items-center justify-between">
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
