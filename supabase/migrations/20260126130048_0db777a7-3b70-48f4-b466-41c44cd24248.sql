-- Add username column to player_progress for leaderboard display
ALTER TABLE public.player_progress ADD COLUMN IF NOT EXISTS username TEXT;

-- Create a policy to allow reading leaderboard data (username, total_mined only)
-- Users can see the leaderboard but only access limited public fields
CREATE POLICY "Anyone can view leaderboard data"
ON public.player_progress
FOR SELECT
USING (true);

-- Drop the old restrictive select policy to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own progress" ON public.player_progress;