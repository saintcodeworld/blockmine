import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Trophy, Medal, Award, ChevronDown, ChevronUp, RefreshCw, Pickaxe } from 'lucide-react';
import { Button } from './button';
import { ScrollArea } from './scroll-area';

export function Leaderboard() {
  const { leaderboard, loading, refresh } = useLeaderboard();
  const [isExpanded, setIsExpanded] = useState(false);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-300" />;
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="w-4 h-4 text-xs text-muted-foreground font-bold flex items-center justify-center">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30';
      default:
        return 'bg-background/30 border-border/30';
    }
  };

  return (
    <div className="absolute top-4 right-4 z-40 pointer-events-auto">
      {/* Collapsed button */}
      {!isExpanded && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="glass-card flex items-center gap-2 hover:bg-primary/20"
        >
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-xs">Leaderboard</span>
        </Button>
      )}

      {/* Expanded panel */}
      {isExpanded && (
        <div className="glass-card rounded-lg w-64 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-gradient-to-r from-yellow-500/10 to-purple-500/10">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold">Top Miners</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Leaderboard list */}
          <ScrollArea className="h-64">
            <div className="p-2 space-y-1">
              {loading && leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  Loading...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <Pickaxe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No miners yet!<br />Be the first to mine blocks.
                </div>
              ) : (
                leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${getRankColor(entry.rank)} transition-all hover:scale-[1.02]`}
                  >
                    <div className="w-6 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex-1 truncate">
                      <span className="text-xs font-medium">{entry.username}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Pickaxe className="w-3 h-3" />
                      <span className="font-mono">{entry.total_mined.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer hint */}
          <div className="px-3 py-1.5 border-t border-border/50 text-center">
            <span className="text-[10px] text-muted-foreground">
              Updates every 30 seconds
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
