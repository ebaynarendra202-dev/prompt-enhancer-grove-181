-- Create table for tracking prompt improvements
CREATE TABLE public.prompt_improvements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_prompt TEXT NOT NULL,
  improved_prompt TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking template usage
CREATE TABLE public.template_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT NOT NULL,
  template_category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_prompt_improvements_created_at ON public.prompt_improvements(created_at DESC);
CREATE INDEX idx_prompt_improvements_model ON public.prompt_improvements(ai_model);
CREATE INDEX idx_template_usage_created_at ON public.template_usage(created_at DESC);
CREATE INDEX idx_template_usage_template_id ON public.template_usage(template_id);
CREATE INDEX idx_template_usage_category ON public.template_usage(template_category);

-- Enable Row Level Security
ALTER TABLE public.prompt_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_usage ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (analytics are not user-specific)
CREATE POLICY "Allow public insert on prompt_improvements"
  ON public.prompt_improvements
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public select on prompt_improvements"
  ON public.prompt_improvements
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on template_usage"
  ON public.template_usage
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public select on template_usage"
  ON public.template_usage
  FOR SELECT
  USING (true);