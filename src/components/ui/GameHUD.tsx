import { useGameStore } from '@/store/gameStore';
import { Pickaxe, Coins, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { Leaderboard } from './Leaderboard';

interface GameHUDProps {
  isPointerLocked: boolean;
}

// Mining reach distance (must match MineCube.tsx)
const MINING_REACH = 5;

export function GameHUD({ isPointerLocked }: GameHUDProps) {
  const player = useGameStore((state) => state.player);
  const isMining = useGameStore((state) => state.isMining);
  const miningStartTime = useGameStore((state) => state.miningStartTime);
  const MINING_TIME = useGameStore((state) => state.MINING_TIME);
  const selectedCubeId = useGameStore((state) => state.selectedCubeId);
  const cubes = useGameStore((state) => state.cubes);
  const TOKENS_BY_TYPE = useGameStore((state) => state.TOKENS_BY_TYPE);

  const { playerCount, isConnected } = useMultiplayer();
  const [miningProgress, setMiningProgress] = useState(0);

  const selectedCube = cubes.find(c => c.id === selectedCubeId);

  // Check if selected cube is in range
  const isInRange = selectedCube && player ? (() => {
    const dx = selectedCube.position[0] - player.position[0];
    const dy = selectedCube.position[1] - player.position[1];
    const dz = selectedCube.position[2] - player.position[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz) <= MINING_REACH;
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
    <div className="absolute inset-0 pointer-events-none font-sans">
      {/* Leaderboard - Always visible */}
      <Leaderboard />

      {/* Token counter and player count */}
      {isPointerLocked && (
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {/* Tokens */}
          <div className="mc-panel px-4 py-2 flex items-center gap-3 bg-[#C6C6C6] text-black">
            <Coins className="w-5 h-5 text-yellow-600" />
            <div>
              <span className="font-bold text-lg">{player.tokens.toLocaleString()}</span>
              <p className="text-[10px] font-bold text-[#555555]">TOKENS</p>
            </div>
          </div>

          {/* Player count indicator */}
          <div className="mc-panel px-4 py-2 flex items-center gap-2 bg-[#C6C6C6] text-black">
            <Users className="w-4 h-4 text-[#555555]" />
            <span className="font-bold text-sm">{playerCount}</span>
            <span className="text-[10px] text-[#555555] uppercase font-bold">
              {isConnected ? 'online' : 'connecting...'}
            </span>
          </div>
        </div>
      )}

      {/* Mining HUD */}
      {isPointerLocked && isMining && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <div className="mc-panel p-2 flex flex-col items-center gap-2 min-w-[200px] bg-[#C6C6C6]">
            {/* Mining progress */}
            {isMining && (
              <div className="w-full">
                <div className="flex justify-between text-xs mb-1 font-bold">
                  <span className="text-black flex items-center gap-1">
                    <Pickaxe className="w-3 h-3 animate-pulse" />
                    MINING
                  </span>
                  <span>{Math.floor(miningProgress)}%</span>
                </div>
                {/* Minecraft Style Progress Bar */}
                <div className="h-4 bg-[#555555] border-2 border-white border-t-[#373737] border-l-[#373737] p-0.5">
                  <div
                    className="h-full bg-[#55FF55]"
                    style={{ width: `${miningProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
