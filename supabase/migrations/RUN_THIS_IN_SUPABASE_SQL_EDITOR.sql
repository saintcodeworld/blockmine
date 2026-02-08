-- Run this in Supabase Dashboard → SQL Editor → New query
-- Fixes: "Could not find the table 'public.player_progress' in the schema cache"
-- Project: your Supabase project (e.g. jmsqvgpsutxusyxephyb)

-- 1. Create player_progress table (no private_key - never store in DB)
CREATE TABLE IF NOT EXISTS public.player_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tokens BIGINT NOT NULL DEFAULT 0,
  total_mined INTEGER NOT NULL DEFAULT 0,
  public_key TEXT,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if re-running (ignore errors)
DROP POLICY IF EXISTS "Users can view their own progress" ON public.player_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.player_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.player_progress;
DROP POLICY IF EXISTS "Anyone can view leaderboard data" ON public.player_progress;

-- 4. Create policies (leaderboard policy allows all SELECT; insert/update are user-only)
CREATE POLICY "Users can insert their own progress"
ON public.player_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.player_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Leaderboard: allow anyone to read (for leaderboard display)
CREATE POLICY "Anyone can view leaderboard data"
ON public.player_progress FOR SELECT
USING (true);

-- 6. Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_player_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_player_progress_updated_at ON public.player_progress;
CREATE TRIGGER update_player_progress_updated_at
BEFORE UPDATE ON public.player_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_player_progress_updated_at();

-- 7. Enable Realtime for player_progress
alter publication supabase_realtime add table player_progress;
