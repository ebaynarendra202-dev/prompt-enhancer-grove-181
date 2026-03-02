
-- Feature 4: Add categorization columns to prompt_improvements
ALTER TABLE public.prompt_improvements
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS complexity text;

-- Feature 5: Create prompt_chains table
CREATE TABLE public.prompt_chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Chain',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chains" ON public.prompt_chains FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own chains" ON public.prompt_chains FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chains" ON public.prompt_chains FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chains" ON public.prompt_chains FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_prompt_chains_updated_at
  BEFORE UPDATE ON public.prompt_chains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Feature 5: Create prompt_chain_steps table
CREATE TABLE public.prompt_chain_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id uuid NOT NULL REFERENCES public.prompt_chains(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 1,
  prompt_text text NOT NULL DEFAULT '',
  output_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_chain_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chain steps" ON public.prompt_chain_steps FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.prompt_chains WHERE id = chain_id AND user_id = auth.uid()));
CREATE POLICY "Users can create their own chain steps" ON public.prompt_chain_steps FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.prompt_chains WHERE id = chain_id AND user_id = auth.uid()));
CREATE POLICY "Users can update their own chain steps" ON public.prompt_chain_steps FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.prompt_chains WHERE id = chain_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete their own chain steps" ON public.prompt_chain_steps FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.prompt_chains WHERE id = chain_id AND user_id = auth.uid()));
