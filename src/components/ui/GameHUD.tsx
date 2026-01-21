import { useGameStore } from '@/store/gameStore';
import { Coins, Pickaxe, Clock, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { WalletModal } from './WalletModal';

export function GameHUD() {
  const player = useGameStore((state) => state.player);
  const lastMineTime = useGameStore((state) => state.lastMineTime);
  const miningCooldown = useGameStore((state) => state.miningCooldown);
  const selectedCubeId = useGameStore((state) => state.selectedCubeId);
  const cubes = useGameStore((state) => state.cubes);
  const [cooldownProgress, setCooldownProgress] = useState(100);
  const [showWallet, setShowWallet] = useState(false);

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
    <>
      <div className="absolute inset-0 pointer-events-none">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-auto">
          {/* Player info */}
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center neon-box">
              <span className="font-pixel text-primary text-lg">
                {player.username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-pixel text-sm text-primary neon-text">{player.username}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Mined: {player.totalMined} blocks
              </p>
            </div>
          </div>

          {/* Token display */}
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-accent animate-pulse-glow" />
              <span className="font-pixel text-2xl text-accent">{player.tokens}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWallet(true)}
              className="neon-box hover:bg-primary/10"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Wallet
            </Button>
          </div>
        </div>

        {/* Bottom center - Mining info */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="glass-card rounded-xl p-4 flex flex-col items-center gap-3">
            {/* Cooldown bar */}
            <div className="flex items-center gap-3 w-64">
              <Clock className={`w-5 h-5 ${canMine ? 'text-neon-green' : 'text-muted-foreground'}`} />
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
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
                {canMine ? 'READY' : `${((miningCooldown - (Date.now() - lastMineTime)) / 1000).toFixed(1)}s`}
              </span>
            </div>

            {/* Selected cube info */}
            {selectedCube ? (
              <div className="flex items-center gap-3 text-sm">
                <Pickaxe className="w-5 h-5 text-primary" />
                <span className="capitalize text-foreground">
                  {selectedCube.type} Block
                </span>
                <span className="text-muted-foreground">
                  HP: {selectedCube.health}/{selectedCube.maxHealth}
                </span>
                <span className="text-xs text-primary font-pixel">
                  Click to mine!
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click a cube to select it, then click again to mine
              </p>
            )}
          </div>
        </div>

        {/* Reward popup area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <WalletModal open={showWallet} onOpenChange={setShowWallet} />
    </>
  );
}
