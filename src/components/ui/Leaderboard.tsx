import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Trophy, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { ScrollArea } from './scroll-area';

export function Leaderboard() {
  const { leaderboard, loading, refresh } = useLeaderboard();

  return (
    <div className="absolute top-4 right-4 z-40 pointer-events-auto font-sans">
      <div className="mc-panel w-64 bg-[#C6C6C6] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-2 border-b-2 border-[#8B8B8B] bg-[#A0A0A0] text-white">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-bold">Top Miners</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 hover:bg-white/20 text-white"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Leaderboard list */}
        <ScrollArea className="h-64 bg-[#C6C6C6]">
          <div className="p-2 space-y-1">
            {loading && leaderboard.length === 0 ? (
              <div className="text-center py-4 text-[#555555] text-xs font-bold">
                Loading...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-4 text-[#555555] text-xs font-bold">
                No miners yet!
              </div>
            ) : (
              leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-2 py-1 border-2 border-[#8B8B8B] ${index === 0 ? 'bg-yellow-200/50' :
                    index === 1 ? 'bg-gray-300' :
                      index === 2 ? 'bg-orange-200/50' : 'bg-[#D6D6D6]'
                    }`}
                >
                  <div className="w-6 flex justify-center text-xs font-bold text-[#373737]">
                    #{index + 1}
                  </div>
                  <div className="flex-1 truncate">
                    <span className="text-xs font-bold text-black">{entry.username}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#555555]">
                    <span className="font-mono font-bold">{entry.total_mined.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
