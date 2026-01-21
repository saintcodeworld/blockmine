import { useGameStore } from '@/store/gameStore';
import { Pickaxe, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GameHUDProps {
  isPointerLocked: boolean;
  isFullscreen?: boolean;
}

export function GameHUD({ isPointerLocked, isFullscreen = false }: GameHUDProps) {
  const player = useGameStore((state) => state.player);
  const lastMineTime = useGameStore((state) => state.lastMineTime);
  const miningCooldown = useGameStore((state) => state.miningCooldown);
  const selectedCubeId = useGameStore((state) => state.selectedCubeId);
  const cubes = useGameStore((state) => state.cubes);
  const [cooldownProgress, setCooldownProgress] = useState(100);

  const selectedCube = cubes.find(c => c.id === selectedCubeId);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastMineTime;
      const progress = Math.min(100, (elapsed / miningCooldown) * 100);
      setCooldownProgress(progress);
    }, 50);

    return () => clearInterval(interval);
  }, [lastMineTime, miningCooldown]);

  if (!player) return null;

  const canMine = cooldownProgress >= 100;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Lock instruction overlay */}
      {!isPointerLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-auto z-40">
          <div className="glass-card rounded-xl p-8 text-center max-w-md animate-fade-in">
            <Pickaxe className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
            <h2 className="font-pixel text-xl text-primary neon-text mb-4">CLICK TO PLAY</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><kbd className="px-2 py-1 bg-muted rounded text-foreground">WASD</kbd> Move around</p>
              <p><kbd className="px-2 py-1 bg-muted rounded text-foreground">Mouse</kbd> Look around</p>
              <p><kbd className="px-2 py-1 bg-muted rounded text-foreground">Click</kbd> Select & Mine blocks</p>
              <p><kbd className="px-2 py-1 bg-muted rounded text-foreground">Space</kbd> Jump</p>
              <p><kbd className="px-2 py-1 bg-muted rounded text-foreground">Shift</kbd> Sprint</p>
              <p><kbd className="px-2 py-1 bg-muted rounded text-foreground">ESC</kbd> Release cursor</p>
            </div>
          </div>
        </div>
      )}

      {/* Top bar - only in fullscreen */}
      {isFullscreen && isPointerLocked && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
          <div className="glass-card rounded-lg px-4 py-2 flex items-center gap-3">
            <span className="font-pixel text-sm text-primary">{player.username}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-accent font-pixel">{player.tokens} tokens</span>
          </div>
        </div>
      )}

      {/* Bottom center - Mining info (always visible when playing) */}
      {isPointerLocked && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="glass-card rounded-xl p-4 flex flex-col items-center gap-3">
            {/* Cooldown bar */}
            <div className="flex items-center gap-3 w-64">
              <Clock className={`w-4 h-4 ${canMine ? 'text-neon-green' : 'text-muted-foreground'}`} />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-100 rounded-full"
                  style={{
                    width: `${cooldownProgress}%`,
                    background: canMine 
                      ? 'linear-gradient(90deg, hsl(145 100% 50%), hsl(165 100% 50%))' 
                      : 'linear-gradient(90deg, hsl(185 100% 50%), hsl(200 100% 50%))',
                    boxShadow: canMine ? '0 0 10px hsl(145 100% 50%)' : 'none',
                  }}
                />
              </div>
              <span className="text-xs font-pixel w-12 text-right">
                {canMine ? 'READY' : `${Math.max(0, (miningCooldown - (Date.now() - lastMineTime)) / 1000).toFixed(1)}s`}
              </span>
            </div>

            {/* Selected cube info */}
            {selectedCube ? (
              <div className="flex items-center gap-3 text-sm">
                <div 
                  className="w-4 h-4 rounded-sm"
                  style={{
                    backgroundColor: selectedCube.type === 'stone' ? '#6b7280' 
                      : selectedCube.type === 'gold' ? '#f59e0b'
                      : selectedCube.type === 'diamond' ? '#06b6d4'
                      : selectedCube.type === 'emerald' ? '#10b981'
                      : '#ef4444'
                  }}
                />
                <span className="capitalize text-foreground">
                  {selectedCube.type}
                </span>
                <span className="text-muted-foreground">
                  HP: {selectedCube.health}/{selectedCube.maxHealth}
                </span>
                {canMine && (
                  <span className="text-xs text-neon-green font-pixel animate-pulse">
                    Click to mine!
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Click a block to select it
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
