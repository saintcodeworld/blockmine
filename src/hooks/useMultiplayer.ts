import { useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';

export interface RemotePlayer {
  odocument: string;
  odocumentId: string; // Actual user ID for deduplication
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

// ==================== SINGLETON MULTIPLAYER STATE ====================
// This prevents multiple hook instances from creating duplicate channels

interface MultiplayerState {
  remotePlayers: Map<string, RemotePlayer>;
  isConnected: boolean;
  playerCount: number;
}

let globalState: MultiplayerState = {
  remotePlayers: new Map(),
  isConnected: false,
  playerCount: 0,
};

let globalChannel: any = null;
let globalPresenceKey: string | null = null;
let globalPlayerColor: string = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
let initializationPromise: Promise<void> | null = null;
let lastUpdateTime = 0;
let pendingUpdate: { position: [number, number, number]; rotation: number } | null = null;

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

function getSnapshot(): MultiplayerState {
  return globalState;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function initializeChannel(presenceKey: string, player: { id: string; username: string; position: [number, number, number]; rotation: number }, userId?: string) {
  // Already initialized with same key
  if (globalChannel && globalPresenceKey === presenceKey) {
    return;
  }

  // Wait for any pending initialization
  if (initializationPromise) {
    await initializationPromise;
    if (globalPresenceKey === presenceKey) return;
  }

  initializationPromise = (async () => {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();
      
      if (!supabase) {
        console.log('[Multiplayer] Backend not available, running in single-player mode');
        return;
      }

      // Cleanup any existing channel
      if (globalChannel) {
        console.log('[Multiplayer] Cleaning up existing channel');
        await globalChannel.unsubscribe();
        globalChannel = null;
      }

      globalPresenceKey = presenceKey;

      const gameChannel = supabase.channel('game-world', {
        config: {
          presence: {
            key: presenceKey,
          },
          broadcast: {
            self: false,
          },
        },
      });

      globalChannel = gameChannel;

      gameChannel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = gameChannel.presenceState();
          const newPlayers = new Map<string, RemotePlayer>();
          
          Object.entries(presenceState).forEach(([key, presences]) => {
            if (key === presenceKey) return;
            if (!presences || presences.length === 0) return;
            
            const presence = presences[0] as any;
            
            newPlayers.set(key, {
              odocument: key,
              odocumentId: presence.userId || key,
              username: presence.username || 'Player',
              position: presence.position || [0, 1.5, 0],
              rotation: presence.rotation || 0,
              isMining: presence.isMining || false,
              color: presence.color || PLAYER_COLORS[0],
            });
          });
          
          globalState = {
            ...globalState,
            remotePlayers: newPlayers,
            playerCount: newPlayers.size + (globalState.isConnected ? 1 : 0),
          };
          notifyListeners();
          console.log(`[Multiplayer] Synced ${newPlayers.size} remote players`);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          if (key === presenceKey) return;
          if (!newPresences || newPresences.length === 0) return;
          
          const presence = newPresences[0] as any;
          console.log(`[Multiplayer] Player joined: ${presence.username || key}`);
          
          const newPlayers = new Map(globalState.remotePlayers);
          newPlayers.set(key, {
            odocument: key,
            odocumentId: presence.userId || key,
            username: presence.username || 'Player',
            position: presence.position || [0, 1.5, 0],
            rotation: presence.rotation || 0,
            isMining: presence.isMining || false,
            color: presence.color || PLAYER_COLORS[0],
          });
          
          globalState = {
            ...globalState,
            remotePlayers: newPlayers,
            playerCount: newPlayers.size + (globalState.isConnected ? 1 : 0),
          };
          notifyListeners();
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log(`[Multiplayer] Player left: ${key}`);
          const newPlayers = new Map(globalState.remotePlayers);
          newPlayers.delete(key);
          
          globalState = {
            ...globalState,
            remotePlayers: newPlayers,
            playerCount: newPlayers.size + (globalState.isConnected ? 1 : 0),
          };
          notifyListeners();
        })
        .subscribe(async (status) => {
          console.log(`[Multiplayer] Channel status: ${status}`);
          if (status === 'SUBSCRIBED') {
            globalState = { ...globalState, isConnected: true };
            notifyListeners();
            
            await gameChannel.track({
              userId: userId || player.id,
              username: player.username,
              position: player.position,
              rotation: player.rotation,
              isMining: false,
              color: globalPlayerColor,
            });
            console.log(`[Multiplayer] Joined as ${player.username} (${presenceKey})`);
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            globalState = { ...globalState, isConnected: false };
            notifyListeners();
          }
        });

    } catch (error) {
      console.log('[Multiplayer] Not available:', error);
    }
  })();

  await initializationPromise;
  initializationPromise = null;
}

async function updateGlobalPosition(
  position: [number, number, number], 
  rotation: number, 
  player: { id: string; username: string }, 
  isMining: boolean,
  userId?: string
) {
  if (!globalChannel) return;

  const now = Date.now();
  pendingUpdate = { position, rotation };

  if (now - lastUpdateTime >= UPDATE_INTERVAL) {
    lastUpdateTime = now;
    try {
      await globalChannel.track({
        userId: userId || player.id,
        username: player.username,
        position: pendingUpdate.position,
        rotation: pendingUpdate.rotation,
        isMining,
        color: globalPlayerColor,
      });
    } catch (error) {
      // Silently handle update errors
    }
  }
}

// ==================== REACT HOOK ====================

export function useMultiplayer() {
  const player = useGameStore((state) => state.player);
  const isMining = useGameStore((state) => state.isMining);
  const { user } = useAuth();
  
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  
  const presenceKey = user?.id || player?.id || '';

  // Initialize channel once
  useEffect(() => {
    if (!player || !presenceKey) return;
    
    initializeChannel(presenceKey, player, user?.id);
    
    // Cleanup on unmount only if this is the last user
    return () => {
      // Don't cleanup - let the channel persist across component remounts
    };
  }, [presenceKey, player?.id, player?.username, user?.id]);

  // Periodic position sync
  useEffect(() => {
    if (!state.isConnected || !player) return;

    const interval = setInterval(() => {
      if (pendingUpdate) {
        updateGlobalPosition(pendingUpdate.position, pendingUpdate.rotation, player, isMining, user?.id);
      }
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [state.isConnected, player, isMining, user?.id]);

  const updatePosition = useCallback(
    (position: [number, number, number], rotation: number) => {
      if (!player) return;
      updateGlobalPosition(position, rotation, player, isMining, user?.id);
    },
    [player, isMining, user?.id]
  );

  return {
    remotePlayers: Array.from(state.remotePlayers.values()),
    isConnected: state.isConnected,
    updatePosition,
    playerCount: state.playerCount,
  };
}
