import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  username: string;
  total_mined: number;
  rank: number;
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const supabase = getSupabase();
      
      const { data, error: fetchError } = await supabase
        .from('player_progress')
        .select('username, total_mined')
        .order('total_mined', { ascending: false })
        .limit(10);

      if (fetchError) {
        throw fetchError;
      }

      const entries: LeaderboardEntry[] = (data || [])
        .filter((row: any) => row.username && row.total_mined > 0)
        .map((row: any, index: number) => ({
          username: row.username,
          total_mined: row.total_mined,
          rank: index + 1,
        }));

      setLeaderboard(entries);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Refresh periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    refresh: fetchLeaderboard,
  };
}
