import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';

export interface RemotePlayer {
  odocument: string;
  username: string;
  position: [number, number, number];
  rotation: number;
  isMining: boolean;
  color: string;
}

const PLAYER_COLORS = [
  '#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1',
  '#84cc16', '#22d3ee', '#e879f9', '#facc15', '#fb923c',
];

// Throttle position updates to support 150+ players
const UPDATE_INTERVAL = 100; // ms between position broadcasts

export function useMultiplayer() {
  const player = useGameStore((state) => state.player);
  const isMining = useGameStore((state) => state.isMining);
  const [remotePlayers, setRemotePlayers] = useState<Map<string, RemotePlayer>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const lastUpdateTime = useRef(0);
  const pendingUpdate = useRef<{ position: [number, number, number]; rotation: number } | null>(null);

  useEffect(() => {
    if (!player) return;

    let cleanup: (() => void) | undefined;

    const initMultiplayer = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
        
        if (!supabase) {
          console.log('Backend not available, running in single-player mode');
          return;
        }

        const gameChannel = supabase.channel('game-world', {
          config: {
            presence: {
              key: player.id,
            },
            broadcast: {
              self: false,
            },
          },
        });

        channelRef.current = gameChannel;

        gameChannel
          .on('presence', { event: 'sync' }, () => {
            const presenceState = gameChannel.presenceState();
            const newPlayers = new Map<string, RemotePlayer>();
            
            Object.entries(presenceState).forEach(([key, presences]) => {
              if (key !== player.id && presences.length > 0) {
                const presence = presences[0] as any;
                newPlayers.set(key, {
                  odocument: key,
                  username: presence.username || 'Player',
                  position: presence.position || [0, 1.5, 0],
                  rotation: presence.rotation || 0,
                  isMining: presence.isMining || false,
                  color: presence.color || PLAYER_COLORS[0],
                });
              }
            });
            
            setRemotePlayers(newPlayers);
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            if (key !== player.id && newPresences.length > 0) {
              const presence = newPresences[0] as any;
              setRemotePlayers((prev) => {
                const next = new Map(prev);
                next.set(key, {
                  odocument: key,
                  username: presence.username || 'Player',
                  position: presence.position || [0, 1.5, 0],
                  rotation: presence.rotation || 0,
                  isMining: presence.isMining || false,
                  color: presence.color || PLAYER_COLORS[0],
                });
                return next;
              });
            }
          })
          .on('presence', { event: 'leave' }, ({ key }) => {
            setRemotePlayers((prev) => {
              const next = new Map(prev);
              next.delete(key);
              return next;
            });
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              const color = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
              await gameChannel.track({
                username: player.username,
                position: player.position,
                rotation: player.rotation,
                isMining: false,
                color,
              });
            }
          });

        cleanup = () => {
          gameChannel.unsubscribe();
          channelRef.current = null;
          setIsConnected(false);
        };
      } catch (error) {
        console.log('Multiplayer not available:', error);
      }
    };

    initMultiplayer();

    return () => {
      if (cleanup) cleanup();
    };
  }, [player?.id]);

  // Update position with throttling to handle 150+ players
  const updatePosition = useCallback(
    async (position: [number, number, number], rotation: number) => {
      if (!channelRef.current || !player) return;

      const now = Date.now();
      pendingUpdate.current = { position, rotation };

      if (now - lastUpdateTime.current >= UPDATE_INTERVAL) {
        lastUpdateTime.current = now;
        try {
          await channelRef.current.track({
            username: player.username,
            position: pendingUpdate.current.position,
            rotation: pendingUpdate.current.rotation,
            isMining,
            color: PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)],
          });
        } catch (error) {
          // Silently handle update errors
        }
      }
    },
    [player, isMining]
  );

  // Sync position periodically
  useEffect(() => {
    if (!isConnected || !player) return;

    const interval = setInterval(() => {
      if (pendingUpdate.current) {
        updatePosition(pendingUpdate.current.position, pendingUpdate.current.rotation);
      }
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isConnected, player, updatePosition]);

  return {
    remotePlayers: Array.from(remotePlayers.values()),
    isConnected,
    updatePosition,
    playerCount: remotePlayers.size + (isConnected ? 1 : 0),
  };
}
