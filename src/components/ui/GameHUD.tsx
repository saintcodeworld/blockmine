import { useGameStore } from '@/store/gameStore';
import { Pickaxe, Coins, Target } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GameHUDProps {
  isPointerLocked: boolean;
  isFullscreen?: boolean;
}

// Mining reach distance (must match MineCube.tsx)
const MINING_REACH = 5;

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

  // Check if selected cube is in range
  const isInRange = selectedCube && player ? (() => {
    const dx = selectedCube.position[0] - player.position[0];
    const dy = selectedCube.position[1] - player.position[1];
    const dz = selectedCube.position[2] - player.position[2];
    return Math.sqrt(dx*dx + dy*dy + dz*dz) <= MINING_REACH;
  })() : false;

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
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-auto z-40">
          <div className="glass-card rounded-xl p-8 text-center max-w-lg animate-fade-in">
            <Pickaxe className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
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

            <div className="p-4 bg-accent/20 rounded-lg border border-accent/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-foreground font-medium">Mining Range: {MINING_REACH} blocks</span>
              </div>
              <p className="text-accent font-pixel text-lg">
                +{TOKENS_PER_BLOCK.toLocaleString()} tokens per block
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Get close to blocks • Hold click for 2 seconds to mine
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Token counter */}
      {isPointerLocked && (
        <div className="absolute top-4 left-4 pointer-events-auto">
          <div className="glass-card rounded-lg px-4 py-3 flex items-center gap-3">
            <Coins className="w-6 h-6 text-accent" />
            <div>
              <span className="font-pixel text-accent text-xl">{player.tokens.toLocaleString()}</span>
              <p className="text-xs text-muted-foreground">TOKENS</p>
            </div>
          </div>
        </div>
      )}

      {/* Mining HUD */}
      {isPointerLocked && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="glass-card rounded-xl p-4 flex flex-col items-center gap-3 min-w-[300px]">
            {/* Mining progress */}
            {isMining && (
              <div className="w-full">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-primary font-pixel flex items-center gap-2">
                    <Pickaxe className="w-4 h-4 animate-pulse" />
                    MINING...
                  </span>
                  <span className="font-pixel">{Math.floor(miningProgress)}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${miningProgress}%`,
                      background: miningProgress >= 100 
                        ? 'linear-gradient(90deg, #10b981, #22c55e)' 
                        : 'linear-gradient(90deg, #06b6d4, #0891b2)',
                      boxShadow: '0 0 15px currentColor',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Selected block info */}
            {selectedCube && !isMining ? (
              <div className="flex items-center gap-3 text-sm">
                <div 
                  className="w-6 h-6 rounded"
                  style={{
                    backgroundColor: selectedCube.type === 'stone' ? '#6b7280' 
                      : selectedCube.type === 'gold' ? '#f59e0b'
                      : selectedCube.type === 'diamond' ? '#06b6d4'
                      : selectedCube.type === 'emerald' ? '#10b981'
                      : '#ef4444'
                  }}
                />
                <span className="capitalize font-medium">{selectedCube.type} Block</span>
                
                {isInRange ? (
                  <span className="text-neon-green font-pixel text-xs animate-pulse">
                    Hold click to mine!
                  </span>
                ) : (
                  <span className="text-destructive font-pixel text-xs">
                    Too far! Get closer
                  </span>
                )}
              </div>
            ) : !isMining && (
              <p className="text-sm text-muted-foreground">
                Click a nearby block to select it
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
