import { useGameStore } from '@/store/gameStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Wallet, ArrowDownToLine, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const player = useGameStore((state) => state.player);
  const withdrawTokens = useGameStore((state) => state.withdrawTokens);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  if (!player) return null;

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleWithdraw = () => {
    if (player.tokens === 0) {
      toast.error('No tokens to withdraw');
      return;
    }
    withdrawTokens();
    toast.success(`Withdrawal initiated for ${player.tokens} tokens!`);
  };

  const truncateKey = (key: string, show: boolean = true) => {
    if (!key || key.length === 0) return '(Not available - requires re-import)';
    if (!show) return '••••••••••••••••••••••••••••••••';
    if (key.length <= 16) return key;
    return `${key.slice(0, 8)}...${key.slice(-8)}`;
  };

  const hasPrivateKey = player.privateKey && player.privateKey.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-pixel text-primary neon-text">
            <Wallet className="w-5 h-5" />
            Your Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Token Balance */}
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30">
            <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
            <p className="font-pixel text-4xl text-accent gold-glow">{player.tokens}</p>
            <p className="text-sm text-muted-foreground mt-2">MINE Tokens</p>
          </div>

          {/* Public Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Public Key</label>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <code className="text-xs flex-1 text-foreground font-mono">
                {truncateKey(player.publicKey)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(player.publicKey, 'Public Key')}
              >
                {copiedField === 'Public Key' ? (
                  <Check className="w-4 h-4 text-neon-green" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Private Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Private Key</label>
              {hasPrivateKey && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="text-xs"
                >
                  {showPrivateKey ? 'Hide' : 'Show'}
                </Button>
              )}
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-lg bg-muted/50 border ${hasPrivateKey ? 'border-destructive/30' : 'border-yellow-500/30'}`}>
              <code className={`text-xs flex-1 font-mono break-all ${hasPrivateKey ? 'text-foreground' : 'text-yellow-500'}`}>
                {truncateKey(player.privateKey, showPrivateKey)}
              </code>
              {hasPrivateKey && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(player.privateKey, 'Private Key')}
                >
                  {copiedField === 'Private Key' ? (
                    <Check className="w-4 h-4 text-neon-green" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            {hasPrivateKey ? (
              <p className="text-xs text-destructive/70">
                ⚠️ Never share your private key! Use it to import into Phantom wallet.
              </p>
            ) : (
              <p className="text-xs text-yellow-500/70">
                ⚠️ Private key was stored on this device only. If you changed browsers/devices, a new wallet was generated.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleWithdraw}
              disabled={player.tokens === 0}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Withdraw Tokens
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://phantom.app/', '_blank')}
              className="neon-box"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Import your private key into Phantom to control your tokens
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
