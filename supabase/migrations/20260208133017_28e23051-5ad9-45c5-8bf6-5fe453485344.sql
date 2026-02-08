-- Create table to track coaching tip interactions
CREATE TABLE public.coaching_tip_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tip_type TEXT NOT NULL,
  tip_priority TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('applied', 'ignored', 'applied_all')),
  prompt_length INTEGER,
  tip_issue TEXT,
  tip_suggestion TEXT
);

-- Enable RLS
ALTER TABLE public.coaching_tip_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own tip interactions"
ON public.coaching_tip_interactions
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own tip interactions"
ON public.coaching_tip_interactions
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for analytics queries
CREATE INDEX idx_coaching_tip_type ON public.coaching_tip_interactions(tip_type);
CREATE INDEX idx_coaching_tip_action ON public.coaching_tip_interactions(action);
CREATE INDEX idx_coaching_tip_created_at ON public.coaching_tip_interactions(created_at);