import { useGameStore } from '@/store/gameStore';
import { Pickaxe, Coins } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GameHUDProps {
  isPointerLocked: boolean;
  isFullscreen?: boolean;
}

export function GameHUD({ isPointerLocked, isFullscreen = false }: GameHUDProps) {
  const player = useGameStore((state) => state.player);
  const isMining = useGameStore((state) => state.isMining);
  const miningStartTime = useGameStore((state) => state.miningStartTime);
  const MINING_TIME = useGameStore((state) => state.MINING_TIME);
  const selectedCubeId = useGameStore((state) => state.selectedCubeId);
  const cubes = useGameStore((state) => state.cubes);
  const TOKENS_PER_BLOCK = useGameStore((state) => state.TOKENS_PER_BLOCK);
  
  const [miningProgress, setMiningProgress] = useState(0);

  const selectedCube = cubes.find(c => c.id === selectedCubeId);

  // Update mining progress
  useEffect(() => {
    if (!isMining) {
      setMiningProgress(0);
      return;
    }

    const interval = setInterval(() => {
      const progress = Math.min(100, ((Date.now() - miningStartTime) / MINING_TIME) * 100);
      setMiningProgress(progress);
    }, 50);

    return () => clearInterval(interval);
  }, [isMining, miningStartTime, MINING_TIME]);

  if (!player) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Click to play overlay */}
      {!isPointerLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-auto z-40">
          <div className="glass-card rounded-xl p-8 text-center max-w-md animate-fade-in">
            <Pickaxe className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
            <h2 className="font-pixel text-xl text-primary neon-text mb-4">CLICK TO PLAY</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><kbd className="px-2 py-1 bg-muted rounded">WASD</kbd> Move</p>
              <p><kbd className="px-2 py-1 bg-muted rounded">Mouse</kbd> Look</p>
              <p><kbd className="px-2 py-1 bg-muted rounded">Click</kbd> Select block, then hold to mine</p>
              <p><kbd className="px-2 py-1 bg-muted rounded">Space</kbd> Jump</p>
              <p><kbd className="px-2 py-1 bg-muted rounded">ESC</kbd> Release cursor</p>
            </div>
            <div className="mt-6 p-4 bg-accent/20 rounded-lg">
              <p className="text-accent font-pixel text-sm">
                +{TOKENS_PER_BLOCK.toLocaleString()} tokens per block
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Hold click for 2 seconds to mine
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Token counter - always visible when playing */}
      {isPointerLocked && (
        <div className="absolute top-4 left-4 pointer-events-auto">
          <div className="glass-card rounded-lg px-4 py-2 flex items-center gap-3">
            <Coins className="w-5 h-5 text-accent" />
            <span className="font-pixel text-accent text-lg">{player.tokens.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Mining progress bar */}
      {isPointerLocked && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="glass-card rounded-xl p-4 flex flex-col items-center gap-3 min-w-[280px]">
            {/* Progress bar */}
            {isMining && (
              <div className="w-full">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-primary font-pixel">MINING...</span>
                  <span>{Math.floor(miningProgress)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${miningProgress}%`,
                      background: miningProgress === 100 
                        ? 'linear-gradient(90deg, #10b981, #22c55e)' 
                        : 'linear-gradient(90deg, #06b6d4, #0891b2)',
                      boxShadow: '0 0 10px currentColor',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Selected block info */}
            {selectedCube && !isMining ? (
              <div className="flex items-center gap-3 text-sm">
                <div 
                  className="w-5 h-5 rounded"
                  style={{
                    backgroundColor: selectedCube.type === 'stone' ? '#6b7280' 
                      : selectedCube.type === 'gold' ? '#f59e0b'
                      : selectedCube.type === 'diamond' ? '#06b6d4'
                      : selectedCube.type === 'emerald' ? '#10b981'
                      : '#ef4444'
                  }}
                />
                <span className="capitalize font-medium">{selectedCube.type} Block</span>
                <span className="text-neon-green font-pixel text-xs animate-pulse">
                  Hold click to mine!
                </span>
              </div>
            ) : !isMining && (
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
