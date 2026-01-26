-- Remove private_key column from player_progress table
-- Private keys should NEVER be stored in the database - only client-side
ALTER TABLE public.player_progress DROP COLUMN IF EXISTS private_key;