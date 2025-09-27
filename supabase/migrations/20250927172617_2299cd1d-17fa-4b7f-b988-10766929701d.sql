-- Create security definer function to check admin existence (bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE role IN ('admin', 'ceo')
    LIMIT 1
  );
$$;

-- Fix the check constraint on check_in_logs to allow 'registered' action
ALTER TABLE public.check_in_logs 
DROP CONSTRAINT IF EXISTS check_in_logs_action_check;

ALTER TABLE public.check_in_logs 
ADD CONSTRAINT check_in_logs_action_check 
CHECK (action IN ('check_in', 'check_out', 'registered', 'failed_lookup', 'system_error'));

-- Grant execute permission to anonymous users for the admin check function
GRANT EXECUTE ON FUNCTION public.check_admin_exists() TO anon;