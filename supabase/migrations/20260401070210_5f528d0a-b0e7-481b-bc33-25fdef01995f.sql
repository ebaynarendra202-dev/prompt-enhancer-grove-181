
-- Create user_roles table for admin access control
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Only admins can view user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create app_settings table for system settings
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings, only admins can modify
CREATE POLICY "Authenticated users can read settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can modify settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create a view for admin to see user activity stats
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT json_build_object(
    'total_improvements', (SELECT COUNT(*) FROM prompt_improvements),
    'total_shared', (SELECT COUNT(*) FROM shared_prompts),
    'total_templates', (SELECT COUNT(*) FROM custom_templates),
    'total_favorites', (SELECT COUNT(*) FROM favorites),
    'total_chains', (SELECT COUNT(*) FROM prompt_chains),
    'improvements_today', (SELECT COUNT(*) FROM prompt_improvements WHERE created_at >= CURRENT_DATE),
    'improvements_this_week', (SELECT COUNT(*) FROM prompt_improvements WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'improvements_this_month', (SELECT COUNT(*) FROM prompt_improvements WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')
  ) INTO result;
  
  RETURN result;
END;
$$;
