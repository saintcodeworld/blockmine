import { useEffect, useState, useCallback } from 'react';
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
];

export function useMultiplayer() {
  const player = useGameStore((state) => state.player);
  const [remotePlayers, setRemotePlayers] = useState<Map<string, RemotePlayer>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!player) return;

    // Dynamically import supabase to handle cases where env vars aren't loaded yet
    const initMultiplayer = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        if (!supabase) {
          console.log('Supabase not available yet');
          return;
        }

        const gameChannel = supabase.channel('game-world', {
          config: {
            presence: {
              key: player.id,
            },
          },
        });

        gameChannel
          .on('presence', { event: 'sync' }, () => {
            const presenceState = gameChannel.presenceState();
            const newPlayers = new Map<string, RemotePlayer>();
            
            Object.entries(presenceState).forEach(([key, presences]) => {
              if (key !== player.id && presences.length > 0) {
                const presence = presences[0] as any;
                newPlayers.set(key, {
                  odocument: key,
                  username: presence.username,
                  position: presence.position || [0, 0, 0],
                  rotation: presence.rotation || 0,
                  isMining: presence.isMining || false,
                  color: presence.color,
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
                  username: presence.username,
                  position: presence.position || [0, 0, 0],
                  rotation: presence.rotation || 0,
                  isMining: presence.isMining || false,
                  color: presence.color,
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
                position: [0, 0, 0],
                rotation: 0,
                isMining: false,
                color,
              });
            }
          });

        return () => {
          gameChannel.unsubscribe();
          setIsConnected(false);
        };
      } catch (error) {
        console.log('Multiplayer not available:', error);
      }
    };

    initMultiplayer();
  }, [player]);

  const updatePosition = useCallback(
    async (position: [number, number, number], rotation: number, isMining: boolean) => {
      // Position updates handled via presence track - simplified for now
    },
    []
  );

  return {
    remotePlayers: Array.from(remotePlayers.values()),
    isConnected,
    updatePosition,
    playerCount: remotePlayers.size + (isConnected ? 1 : 0),
  };
}
