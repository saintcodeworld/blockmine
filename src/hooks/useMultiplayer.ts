import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';

export interface RemotePlayer {
  odocument: string;
  odocumentId: string;
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

const UPDATE_INTERVAL = 50; // Faster updates for smoother movement

// Global singleton to prevent duplicate channels
let globalChannel: any = null;
let globalPresenceKey: string | null = null;
let isInitializing = false;
let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;

// Shared state that all hook instances can read
let sharedRemotePlayers = new Map<string, RemotePlayer>();
let sharedIsConnected = false;
const stateListeners = new Set<() => void>();

function notifyStateChange() {
  stateListeners.forEach(fn => fn());
}

export function useMultiplayer() {
  const player = useGameStore((state) => state.player);
  const isMining = useGameStore((state) => state.isMining);
  const { user } = useAuth();
  
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const lastUpdateTime = useRef(0);
  const lastMiningState = useRef(false);
  const pendingUpdate = useRef<{ position: [number, number, number]; rotation: number } | null>(null);
  const playerColorRef = useRef(PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)]);

  const presenceKey = user?.id || player?.id || '';

  // Subscribe to shared state changes
  useEffect(() => {
    const handleChange = () => {
      setRemotePlayers(Array.from(sharedRemotePlayers.values()));
      setIsConnected(sharedIsConnected);
    };
    
    stateListeners.add(handleChange);
    // Initial sync
    handleChange();
    
    return () => {
      stateListeners.delete(handleChange);
    };
  }, []);

  // Initialize channel (singleton)
  useEffect(() => {
    if (!player || !presenceKey) return;
    
    // Clear any pending cleanup
    if (cleanupTimeout) {
      clearTimeout(cleanupTimeout);
      cleanupTimeout = null;
    }
    
    // Already initialized with same key or currently initializing
    if ((globalChannel && globalPresenceKey === presenceKey) || isInitializing) {
      return;
    }

    const initChannel = async () => {
      isInitializing = true;
      
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();
        
        if (!supabase) {
          console.log('[Multiplayer] Backend not available');
          isInitializing = false;
          return;
        }

        // Cleanup existing channel properly
        if (globalChannel) {
          try {
            await supabase.removeChannel(globalChannel);
          } catch (e) {
            // Ignore cleanup errors
          }
          globalChannel = null;
        }

        globalPresenceKey = presenceKey;

        const gameChannel = supabase.channel('game-world', {
          config: {
            presence: { key: presenceKey },
            broadcast: { self: false },
          },
        });

        globalChannel = gameChannel;

        // Track known players to detect actual joins/leaves
        const knownPlayers = new Set<string>();
        let hasInitialized = false;

        gameChannel
          .on('presence', { event: 'sync' }, () => {
            const presenceState = gameChannel.presenceState();
            const newPlayers = new Map<string, RemotePlayer>();
            
            Object.entries(presenceState).forEach(([key, presences]) => {
              if (key === presenceKey || !presences?.length) return;
              const p = presences[0] as any;
              newPlayers.set(key, {
                odocument: key,
                odocumentId: p.userId || key,
                username: p.username || 'Player',
                position: p.position || [0, 1.5, 0],
                rotation: p.rotation || 0,
                isMining: Boolean(p.isMining),
                color: p.color || PLAYER_COLORS[0],
              });
            });
            
            sharedRemotePlayers = newPlayers;
            hasInitialized = true;
            notifyStateChange();
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            if (key === presenceKey || !newPresences?.length) return;
            
            // Skip if this is initial sync (player was already there)
            if (!hasInitialized || knownPlayers.has(key)) {
              knownPlayers.add(key);
              return;
            }
            
            const p = newPresences[0] as any;
            const playerColor = p.color || PLAYER_COLORS[0];
            const playerUsername = p.username || 'Player';
            
            knownPlayers.add(key);
            
            const updated = new Map(sharedRemotePlayers);
            updated.set(key, {
              odocument: key,
              odocumentId: p.userId || key,
              username: playerUsername,
              position: p.position || [0, 1.5, 0],
              rotation: p.rotation || 0,
              isMining: Boolean(p.isMining),
              color: playerColor,
            });
            sharedRemotePlayers = updated;
            notifyStateChange();
            
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            // Only notify if we actually knew about this player
            if (!knownPlayers.has(key)) return;
            
            // Get player info before removing
            const leavingPlayer = sharedRemotePlayers.get(key);
            knownPlayers.delete(key);
            
            const updated = new Map(sharedRemotePlayers);
            updated.delete(key);
            sharedRemotePlayers = updated;
            notifyStateChange();
            
          })
          .subscribe(async (status) => {
            console.log(`[Multiplayer] Status: ${status}`);
            
            if (status === 'SUBSCRIBED') {
              sharedIsConnected = true;
              notifyStateChange();
              
              await gameChannel.track({
                userId: user?.id || player.id,
                username: player.username,
                position: player.position,
                rotation: player.rotation,
                isMining: false,
                color: playerColorRef.current,
              });
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              sharedIsConnected = false;
              notifyStateChange();
            }
          });
          
      } catch (error) {
        console.log('[Multiplayer] Error:', error);
      } finally {
        isInitializing = false;
      }
    };

    initChannel();
    
    // Cleanup on unmount with delay to prevent rapid reconnections
    return () => {
      cleanupTimeout = setTimeout(async () => {
        if (globalChannel) {
          try {
            const { getSupabase } = await import('@/lib/supabase');
            const supabase = getSupabase();
            if (supabase) {
              await supabase.removeChannel(globalChannel);
            }
          } catch (e) {
            // Ignore
          }
          globalChannel = null;
          globalPresenceKey = null;
          sharedIsConnected = false;
          sharedRemotePlayers = new Map();
          notifyStateChange();
        }
      }, 1000); // 1 second delay before cleanup
    };
  }, [presenceKey, player?.id, player?.username, user?.id]);

  // Broadcast mining state changes immediately
  useEffect(() => {
    if (!globalChannel || !player || !sharedIsConnected) return;
    
    // Only send update if mining state actually changed
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
      if (!globalChannel || !player) return;

      const now = Date.now();
      pendingUpdate.current = { position, rotation };

      if (now - lastUpdateTime.current >= UPDATE_INTERVAL) {
        lastUpdateTime.current = now;
        try {
          await globalChannel.track({
            userId: user?.id || player.id,
            username: player.username,
            position,
            rotation,
            isMining,
            color: playerColorRef.current,
          });
        } catch {
          // Ignore errors
        }
      }
    },
    [player, isMining, user?.id]
  );

  // Periodic sync
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
