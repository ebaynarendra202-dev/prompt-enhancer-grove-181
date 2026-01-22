-- Add UPDATE policy for prompt_improvements so users can update their own records (for tracking copy/favorite actions)
CREATE POLICY "Users can update their own prompt improvements" 
ON public.prompt_improvements 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);