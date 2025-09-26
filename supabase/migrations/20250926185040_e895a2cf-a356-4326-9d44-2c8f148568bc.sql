-- Fix the admin_users table structure
DROP TABLE IF EXISTS public.admin_users CASCADE;

CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'ceo', 'operations_manager', 'receptionist', 'barista', 'community_manager')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
CREATE POLICY "Admin users can view all admin users" 
ON public.admin_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.is_active = true
  )
);

CREATE POLICY "Admin users can update their own profile" 
ON public.admin_users 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create function to check if user is admin/staff
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = check_user_id 
    AND is_active = true
  );
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.admin_users 
  WHERE user_id = check_user_id 
  AND is_active = true
  LIMIT 1;
$$;

-- Create enhanced logging table for production monitoring
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_level TEXT NOT NULL CHECK (log_level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES public.clients(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for system logs (only admins can view)
CREATE POLICY "Only admins can view system logs" 
ON public.system_logs 
FOR SELECT 
USING (public.is_admin_user());

-- Create function for system logging
CREATE OR REPLACE FUNCTION public.log_system_event(
  p_log_level TEXT,
  p_event_type TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_user_id UUID DEFAULT auth.uid(),
  p_client_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.system_logs (
    log_level, event_type, message, metadata, user_id, client_id
  )
  VALUES (
    p_log_level, p_event_type, p_message, p_metadata, p_user_id, p_client_id
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create trigger to update admin_users updated_at
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();