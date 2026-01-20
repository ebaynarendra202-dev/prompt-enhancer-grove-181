-- Create template_favorites table for storing user's favorite templates
CREATE TABLE public.template_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'builtin' CHECK (template_type IN ('builtin', 'custom')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id, template_type)
);

-- Enable Row Level Security
ALTER TABLE public.template_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own template favorites" 
ON public.template_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own template favorites" 
ON public.template_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own template favorites" 
ON public.template_favorites 
FOR DELETE 
USING (auth.uid() = user_id);