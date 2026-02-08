-- Create player_progress table to store tokens and mining stats
CREATE TABLE public.player_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tokens BIGINT NOT NULL DEFAULT 0,
  total_mined INTEGER NOT NULL DEFAULT 0,
  public_key TEXT,
  private_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own progress" 
ON public.player_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.player_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.player_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_player_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_player_progress_updated_at
BEFORE UPDATE ON public.player_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_player_progress_updated_at();