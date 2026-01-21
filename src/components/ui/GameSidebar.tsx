import { useGameStore } from '@/store/gameStore';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useAuth } from '@/hooks/useAuth';
import { Coins, Pickaxe, Users, Wallet, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WalletModal } from './WalletModal';
import { ScrollArea } from '@/components/ui/scroll-area';

export function GameSidebar() {
  const player = useGameStore((state) => state.player);
  const cubes = useGameStore((state) => state.cubes);
  const { remotePlayers, isConnected, playerCount } = useMultiplayer();
  const { signOut } = useAuth();
  const [showWallet, setShowWallet] = useState(false);

  if (!player) return null;

  // Count cube types
  const cubeCounts = cubes.reduce((acc, cube) => {
    acc[cube.type] = (acc[cube.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="w-72 h-full bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center neon-box">
              <span className="font-pixel text-primary text-lg">
                {player.username[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-pixel text-sm text-primary neon-text">{player.username}</h3>
              <p className="text-xs text-muted-foreground">Miner Level 1</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-accent" />
              <span className="text-sm">Tokens</span>
            </div>
            <span className="font-pixel text-accent text-lg">{player.tokens}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pickaxe className="w-5 h-5 text-primary" />
              <span className="text-sm">Total Mined</span>
            </div>
            <span className="font-pixel text-primary">{player.totalMined}</span>
          </div>

          <Button
            variant="outline"
            className="w-full neon-box hover:bg-primary/10"
            onClick={() => setShowWallet(true)}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Open Wallet
          </Button>
        </div>

        {/* Online Players */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neon-green" />
              <span className="text-sm font-medium">Online Players</span>
            </div>
            <span className="text-xs bg-neon-green/20 text-neon-green px-2 py-1 rounded-full">
              {playerCount}
            </span>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {/* Current player */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30">
                <div className="w-8 h-8 rounded bg-primary/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {player.username[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{player.username}</p>
                  <p className="text-xs text-muted-foreground">You</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-neon-green" />
              </div>

              {/* Remote players */}
              {remotePlayers.map((rPlayer) => (
                <div 
                  key={rPlayer.odocument} 
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div 
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{ backgroundColor: `${rPlayer.color}30`, borderColor: rPlayer.color, borderWidth: 1 }}
                  >
                    <span className="text-xs font-bold" style={{ color: rPlayer.color }}>
                      {rPlayer.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{rPlayer.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {rPlayer.isMining ? 'Mining...' : 'Exploring'}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-neon-green" />
                </div>
              ))}

              {remotePlayers.length === 0 && isConnected && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No other players online
                </p>
              )}

              {!isConnected && (
                <p className="text-sm text-yellow-500 text-center py-4">
                  Connecting to server...
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* World Stats */}
        <div className="p-4 border-t border-border">
          <h4 className="text-xs text-muted-foreground mb-2">Available Blocks</h4>
          <div className="grid grid-cols-5 gap-1">
            {Object.entries(cubeCounts).map(([type, count]) => (
              <div 
                key={type} 
                className="text-center p-1 rounded bg-muted/30"
                title={`${type}: ${count}`}
              >
                <div 
                  className="w-4 h-4 mx-auto rounded-sm mb-0.5"
                  style={{
                    backgroundColor: type === 'stone' ? '#6b7280' 
                      : type === 'gold' ? '#f59e0b'
                      : type === 'diamond' ? '#06b6d4'
                      : type === 'emerald' ? '#10b981'
                      : '#ef4444'
                  }}
                />
                <span className="text-[10px] text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
          
          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full mt-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <WalletModal open={showWallet} onOpenChange={setShowWallet} />
    </>
  );
}
