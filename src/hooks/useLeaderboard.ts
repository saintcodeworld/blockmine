import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';

export interface LeaderboardEntry {
  username: string;
  tokens: number;
  rank: number;
}

export function useLeaderboard() {
  const [remoteLeaderboard, setRemoteLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldRefresh, setShouldRefresh] = useState(0);

  const player = useGameStore(state => state.player);

  // Combine remote data with local player data for instant feedback
  const leaderboard = useMemo(() => {
    // Start with remote data
    let combined = [...remoteLeaderboard];

    // If we have a local player, allow them to override the remote data
    // This allows the user to see their score update instantly while mining
    if (player) {
      const playerIndex = combined.findIndex(e => e.username === player.username);

      if (playerIndex >= 0) {
        // Player exists in list, update their tokens
        combined[playerIndex] = {
          ...combined[playerIndex],
          tokens: player.tokens
        };
      } else {
        // Player not in list, add them (we'll sort and slice later)
        combined.push({
          username: player.username,
          tokens: player.tokens,
          rank: 0 // Temporary rank
        });
      }
    }

    // Sort by tokens descending
    combined.sort((a, b) => b.tokens - a.tokens);

    // Re-assign ranks and take top 10
    return combined
      .slice(0, 10)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
  }, [remoteLeaderboard, player?.tokens, player?.username]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const supabase = getSupabase();

      const { data, error: fetchError } = await supabase
        .from('player_progress')
        .select('username, tokens')
        .order('tokens', { ascending: false })
        .limit(10);

      if (fetchError) {
        throw fetchError;
      }

      const entries: LeaderboardEntry[] = (data || [])
        // Filter out users with no username
        .filter((row: any) => row.username)
        .map((row: any, index: number) => ({
          username: row.username,
          tokens: row.tokens,
          rank: index + 1,
        }));

      setRemoteLeaderboard(entries);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and manual refresh
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard, shouldRefresh]);

  // Real-time subscription with debounce
  useEffect(() => {
    const supabase = getSupabase();
    let refreshTimeout: NodeJS.Timeout;

    // Subscribe to changes in the player_progress table
    const channel = supabase
      .channel('public:player_progress')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'player_progress',
        },
        () => {
          // Debounce updates: wait 1s after last event to refresh
          // This prevents spamming fetches during rapid updates but ensures
          // we eventually get the latest state
          clearTimeout(refreshTimeout);
          refreshTimeout = setTimeout(() => {
            setShouldRefresh(prev => prev + 1);
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(refreshTimeout);
    };
  }, []);

  return {
    leaderboard,
    loading,
    error,
    refresh: () => setShouldRefresh(prev => prev + 1),
  };
}
