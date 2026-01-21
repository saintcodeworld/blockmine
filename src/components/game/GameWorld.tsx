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
    if (gameContainerRef.current && !document.pointerLockElement) {
      gameContainerRef.current.requestPointerLock();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Listen for pointer lock changes
  useEffect(() => {
    const handlePointerLockChange = () => {
      setIsPointerLocked(!!document.pointerLockElement);
    };

    const handlePointerLockError = () => {
      console.log('Pointer lock error');
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, []);

  // Handle ESC to exit fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen && !document.pointerLockElement) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!isRegistered) {
    return <RegisterScreen />;
  }

  return (
    <div className="w-full h-screen bg-background overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar - hidden in fullscreen */}
        {!isFullscreen && <GameSidebar />}

        {/* Main game area */}
        <div className="flex-1 flex flex-col p-4 gap-4">
          {/* Game container */}
          <div 
            className={`relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl transition-all duration-300 ${
              isFullscreen 
                ? 'fixed inset-0 z-50 rounded-none border-0' 
                : 'flex-1'
            }`}
            style={{ 
              background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%)',
              boxShadow: '0 0 40px rgba(6, 182, 212, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Fullscreen toggle button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-primary/20 neon-box"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>

            {/* Game canvas */}
            <div 
              ref={gameContainerRef}
              className="absolute inset-0 cursor-crosshair"
              onClick={handleRequestPointerLock}
            >
              <GameScene onRequestPointerLock={handleRequestPointerLock} />
            </div>
            
            {/* Crosshair */}
            {isPointerLocked && <Crosshair />}
            
            {/* HUD overlay */}
            <GameHUD isPointerLocked={isPointerLocked} isFullscreen={isFullscreen} />
          </div>

          {/* Bottom info bar - hidden in fullscreen */}
          {!isFullscreen && (
            <div className="glass-card rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <span>Connected to server</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">F</kbd> or click button for fullscreen
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
