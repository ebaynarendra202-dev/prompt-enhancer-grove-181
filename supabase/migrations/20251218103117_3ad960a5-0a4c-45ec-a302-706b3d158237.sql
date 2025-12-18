-- Create table for shared prompts
CREATE TABLE public.shared_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
  original_prompt TEXT NOT NULL,
  improved_prompt TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.shared_prompts ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared prompts (public sharing)
CREATE POLICY "Shared prompts are publicly viewable"
ON public.shared_prompts
FOR SELECT
USING (true);

-- Authenticated users can create shared prompts
CREATE POLICY "Authenticated users can create shared prompts"
ON public.shared_prompts
FOR INSERT
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Create index for faster lookups by share_id
CREATE INDEX idx_shared_prompts_share_id ON public.shared_prompts(share_id);