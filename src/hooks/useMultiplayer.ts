import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';

export interface RemotePlayer {
  odocument: string;
  odocumentId: string;
  username: string;
  position: [number, number, number];
  rotation: number;
  velocity: [number, number, number];
  isMining: boolean;
  color: string;
  lastUpdate: number;
}

const PLAYER_COLORS = [
  '#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1',
  '#84cc16', '#22d3ee', '#e879f9', '#facc15', '#fb923c',
];

const UPDATE_INTERVAL = 33;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

let globalChannel: any = null;
let globalPresenceKey: string | null = null;
let isInitializing = false;
let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;

let sharedRemotePlayers = new Map<string, RemotePlayer>();
let sharedIsConnected = false;
const stateListeners = new Set<() => void>();

function notifyStateChange() {
  stateListeners.forEach(fn => fn());
}

async function destroyChannel() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (cleanupTimeout) {
    clearTimeout(cleanupTimeout);
    cleanupTimeout = null;
  }
  if (globalChannel) {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();
      if (supabase) {
        await supabase.removeChannel(globalChannel);
      }
    } catch {}
    globalChannel = null;
  }
  globalPresenceKey = null;
  isInitializing = false;
  reconnectAttempts = 0;
  sharedIsConnected = false;
  sharedRemotePlayers = new Map();
  notifyStateChange();
}

export function useMultiplayer() {
  const player = useGameStore((state) => state.player);
  const isMining = useGameStore((state) => state.isMining);
  const { user } = useAuth();

  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const lastUpdateTime = useRef(0);
  const lastMiningState = useRef(false);
  const lastPosition = useRef<[number, number, number] | null>(null);
  const pendingUpdate = useRef<{ position: [number, number, number]; rotation: number } | null>(null);
  const playerColorRef = useRef(PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]);
  const stablePresenceKey = useRef<string | null>(null);

  const presenceKey = user?.id || player?.id || '';

  if (presenceKey && !stablePresenceKey.current) {
    stablePresenceKey.current = presenceKey;
  }

  useEffect(() => {
    const handleChange = () => {
      setRemotePlayers(Array.from(sharedRemotePlayers.values()));
      setIsConnected(sharedIsConnected);
    };

    stateListeners.add(handleChange);
    handleChange();

    return () => {
      stateListeners.delete(handleChange);
    };
  }, []);

  useEffect(() => {
    const key = stablePresenceKey.current;
    if (!player || !key) return;

    if (cleanupTimeout) {
      clearTimeout(cleanupTimeout);
      cleanupTimeout = null;
    }

    if ((globalChannel && globalPresenceKey === key) || isInitializing) {
      return;
    }

    const initChannel = async () => {
      isInitializing = true;
      reconnectAttempts = 0;

      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();

        if (!supabase) {
          isInitializing = false;
          return;
        }

        if (globalChannel) {
          try {
            await supabase.removeChannel(globalChannel);
          } catch {}
          globalChannel = null;
        }

        globalPresenceKey = key;

        const gameChannel = supabase.channel('game-world', {
          config: {
            presence: { key },
            broadcast: { self: false },
          },
        });

        globalChannel = gameChannel;

        const knownPlayers = new Set<string>();
        let hasInitialized = false;

        const currentUserId = user?.id;
        const currentPlayerRef = useGameStore.getState().player;

        gameChannel
          .on('presence', { event: 'sync' }, () => {
            const presenceState = gameChannel.presenceState();
            const newPlayers = new Map<string, RemotePlayer>();
            const now = Date.now();

            Object.entries(presenceState).forEach(([pKey, presences]) => {
              if (pKey === key || !presences?.length) return;

              const p = presences[0] as any;

              if (currentUserId && p.userId === currentUserId) return;

              const existingPlayer = sharedRemotePlayers.get(pKey);
              const newPos: [number, number, number] = p.position || [0, 1.5, 0];

              let velocity: [number, number, number] = [0, 0, 0];
              if (existingPlayer && p.timestamp) {
                const dt = (now - existingPlayer.lastUpdate) / 1000;
                if (dt > 0 && dt < 1) {
                  velocity = [
                    (newPos[0] - existingPlayer.position[0]) / dt,
                    (newPos[1] - existingPlayer.position[1]) / dt,
                    (newPos[2] - existingPlayer.position[2]) / dt,
                  ];
                }
              }

              newPlayers.set(pKey, {
                odocument: pKey,
                odocumentId: p.userId || pKey,
                username: p.username || 'Player',
                position: newPos,
                rotation: p.rotation || 0,
                velocity,
                isMining: Boolean(p.isMining),
                color: p.color || PLAYER_COLORS[0],
                lastUpdate: now,
              });
            });

            sharedRemotePlayers = newPlayers;
            hasInitialized = true;
            notifyStateChange();
          })
          .on('presence', { event: 'join' }, ({ key: joinKey, newPresences }) => {
            if (joinKey === key || !newPresences?.length) return;

            const p = newPresences[0] as any;

            if (currentUserId && p.userId === currentUserId) return;

            if (!hasInitialized || knownPlayers.has(joinKey)) {
              knownPlayers.add(joinKey);
              return;
            }

            knownPlayers.add(joinKey);

            const updated = new Map(sharedRemotePlayers);
            updated.set(joinKey, {
              odocument: joinKey,
              odocumentId: p.userId || joinKey,
              username: p.username || 'Player',
              position: p.position || [0, 1.5, 0],
              rotation: p.rotation || 0,
              velocity: [0, 0, 0],
              isMining: Boolean(p.isMining),
              color: p.color || PLAYER_COLORS[0],
              lastUpdate: Date.now(),
            });
            sharedRemotePlayers = updated;
            notifyStateChange();
          })
          .on('presence', { event: 'leave' }, ({ key: leaveKey }) => {
            knownPlayers.delete(leaveKey);

            if (sharedRemotePlayers.has(leaveKey)) {
              const updated = new Map(sharedRemotePlayers);
              updated.delete(leaveKey);
              sharedRemotePlayers = updated;
              notifyStateChange();
            }
          })
          .subscribe(async (status) => {
            console.log(`[Multiplayer] Status: ${status}`);

            if (status === 'SUBSCRIBED') {
              sharedIsConnected = true;
              reconnectAttempts = 0;
              notifyStateChange();

              const latestPlayer = useGameStore.getState().player;
              if (latestPlayer) {
                await gameChannel.track({
                  userId: user?.id || latestPlayer.id,
                  username: latestPlayer.username,
                  position: latestPlayer.position,
                  rotation: latestPlayer.rotation,
                  isMining: false,
                  color: playerColorRef.current,
                }).catch(() => {});
              }
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              sharedIsConnected = false;
              notifyStateChange();

              if (gameChannel === globalChannel && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                const delay = RECONNECT_DELAY * reconnectAttempts;
                console.log(`[Multiplayer] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                reconnectTimeout = setTimeout(() => {
                  if (globalChannel === gameChannel) {
                    globalChannel = null;
                    globalPresenceKey = null;
                    isInitializing = false;
                    initChannel();
                  }
                }, delay);
              }
            }
          });

      } catch (error) {
        console.log('[Multiplayer] Error:', error);
      } finally {
        isInitializing = false;
      }
    };

    initChannel();

    return () => {
      cleanupTimeout = setTimeout(() => {
        destroyChannel();
      }, 2000);
    };
  }, [stablePresenceKey.current, !!player]);

  useEffect(() => {
    if (!globalChannel || !player || !sharedIsConnected) return;

    if (lastMiningState.current !== isMining) {
      lastMiningState.current = isMining;

      globalChannel.track({
        userId: user?.id || player.id,
        username: player.username,
        position: player.position,
        rotation: player.rotation,
        isMining: isMining,
        color: playerColorRef.current,
      }).catch(() => {});
    }
  }, [isMining, player, user?.id]);

  const updatePosition = useCallback(
    async (position: [number, number, number], rotation: number) => {
      if (!globalChannel || !player || !sharedIsConnected) return;

      const now = Date.now();
      pendingUpdate.current = { position, rotation };

      let velocity: [number, number, number] = [0, 0, 0];
      if (lastPosition.current && lastUpdateTime.current > 0) {
        const dt = (now - lastUpdateTime.current) / 1000;
        if (dt > 0 && dt < 1) {
          velocity = [
            (position[0] - lastPosition.current[0]) / dt,
            (position[1] - lastPosition.current[1]) / dt,
            (position[2] - lastPosition.current[2]) / dt,
          ];
        }
      }

      if (now - lastUpdateTime.current >= UPDATE_INTERVAL) {
        lastUpdateTime.current = now;
        lastPosition.current = [...position];

        try {
          await globalChannel.track({
            userId: user?.id || player.id,
            username: player.username,
            position,
            rotation,
            velocity,
            timestamp: now,
            isMining,
            color: playerColorRef.current,
          });
        } catch {}
      }
    },
    [player, isMining, user?.id]
  );

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
    remotePlayers,
    isConnected,
    updatePosition,
    playerCount: remotePlayers.length + (isConnected ? 1 : 0),
  };
}
