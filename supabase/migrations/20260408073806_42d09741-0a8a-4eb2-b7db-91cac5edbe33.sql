
-- Create prompt_collections table
CREATE TABLE public.prompt_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompt_collections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own collections"
ON public.prompt_collections FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
ON public.prompt_collections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
ON public.prompt_collections FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
ON public.prompt_collections FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_prompt_collections_updated_at
BEFORE UPDATE ON public.prompt_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add collection_id to favorites table
ALTER TABLE public.favorites ADD COLUMN collection_id UUID REFERENCES public.prompt_collections(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX idx_favorites_collection_id ON public.favorites(collection_id);
CREATE INDEX idx_prompt_collections_user_id ON public.prompt_collections(user_id);
