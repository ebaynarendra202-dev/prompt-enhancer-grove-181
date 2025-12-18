-- Allow anyone to update view_count on shared prompts
CREATE POLICY "Anyone can increment view count"
ON public.shared_prompts
FOR UPDATE
USING (true)
WITH CHECK (true);