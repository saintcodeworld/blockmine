import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pickaxe, Sparkles, Coins, Users, Shield } from 'lucide-react';

export function RegisterScreen() {
  const [username, setUsername] = useState('');
  const register = useGameStore((state) => state.register);
  const TOKENS_PER_BLOCK = useGameStore((state) => state.TOKENS_PER_BLOCK);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length >= 3) {
      register(username.trim());
    }
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

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="glass-card rounded-2xl p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Choose Your Miner Name
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (min 3 characters)"
                className="bg-muted border-border focus:border-primary focus:ring-primary text-lg h-12"
                minLength={3}
                maxLength={20}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={username.trim().length < 3}
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary via-glow-cyan to-secondary hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Mining
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              You'll receive a unique Solana wallet upon registration.
              <br />
              Mine blocks and withdraw tokens to your Phantom wallet.
            </p>
          </div>
        </form>

        {/* Token info */}
        <div className="mt-8 glass-card rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">Earn per block mined</p>
          <p className="font-pixel text-2xl text-accent gold-glow">
            +{TOKENS_PER_BLOCK.toLocaleString()} tokens
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Hold click for 2 seconds to break a block • Blocks respawn after 1 minute
          </p>
        </div>
      </div>
    </div>
  );
}
