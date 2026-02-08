import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Pickaxe, Sparkles, Coins, Users, Shield } from 'lucide-react';

export function RegisterScreen() {
  const register = useGameStore((state) => state.register);
  const TOKENS_BY_TYPE = useGameStore((state) => state.TOKENS_BY_TYPE);
  const { getUsername, user } = useAuth();

  // Auto-register with authenticated username
  useEffect(() => {
    if (user) {
      const username = getUsername();
      register(username);
    }
  }, [user, getUsername, register]);

  const handleEnterGame = () => {
    const username = getUsername();
    register(username);
  };

  return (
    <div className="min-h-screen void-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 neon-box mb-6 animate-pulse-glow">
            <Pickaxe className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-pixel text-3xl md:text-4xl text-primary neon-text mb-3">
            CRYPTO MINE
          </h1>
          <p className="text-muted-foreground text-lg">
            Mine blocks. Earn tokens. Build fortune.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4 text-center">
            <Coins className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Earn Tokens</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Multiplayer</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Shield className="w-8 h-8 text-neon-green mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Own Wallet</p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="glass-card rounded-2xl p-6 md:p-8 text-center">
          <div className="mb-6">
            <p className="text-muted-foreground mb-2">Welcome back,</p>
            <p className="font-pixel text-2xl text-primary neon-text">
              {getUsername()}
            </p>
          </div>

          <Button
            onClick={handleEnterGame}
            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary via-glow-cyan to-secondary hover:opacity-90 transition-all"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Enter the Mine
          </Button>

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              You'll receive a unique Solana wallet upon entering.
              <br />
              Mine blocks and withdraw tokens to your Phantom wallet.
            </p>
          </div>
        </div>

        {/* Token info */}
        <div className="mt-8 glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-3 text-center">Tokens per block</p>
          <div className="grid grid-cols-5 gap-2 text-center">
            {Object.entries(TOKENS_BY_TYPE).map(([type, tokens]) => (
              <div key={type} className="flex flex-col items-center gap-1">
                <div 
                  className="w-6 h-6 rounded"
                  style={{
                    backgroundColor: type === 'stone' ? '#6b7280' 
                      : type === 'gold' ? '#f59e0b'
                      : type === 'diamond' ? '#06b6d4'
                      : type === 'emerald' ? '#10b981'
                      : '#ef4444'
                  }}
                />
                <span className="text-xs text-muted-foreground capitalize">{type}</span>
                <span className="font-pixel text-xs text-accent">+{tokens.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Hold click for 2 seconds to break a block • Blocks respawn after 1 minute
          </p>
        </div>
      </div>
    </div>
  );
}
