-- Add prompt effectiveness tracking fields
ALTER TABLE public.prompt_improvements 
ADD COLUMN IF NOT EXISTS was_copied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS was_favorited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS quality_score integer;

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_prompt_improvements_created_at ON public.prompt_improvements(created_at);
CREATE INDEX IF NOT EXISTS idx_prompt_improvements_user_id ON public.prompt_improvements(user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.prompt_improvements.was_copied IS 'Whether the improved prompt was copied to clipboard';
COMMENT ON COLUMN public.prompt_improvements.was_favorited IS 'Whether the improved prompt was added to favorites';
COMMENT ON COLUMN public.prompt_improvements.quality_score IS 'AI-analyzed quality score of the improved prompt (0-100)';