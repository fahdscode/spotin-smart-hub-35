-- Phase 1: Fix RLS Policy Recursion and Database Issues

-- First, drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all admin users" ON public.admin_users;

-- Create security definer functions to break recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ceo')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ceo', 'operations_manager', 'finance_manager', 'community_manager', 'receptionist', 'barista')
  );
$$;

-- Recreate profiles policies without recursion
CREATE POLICY "Staff can view all profiles (non-recursive)"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  public.is_current_user_staff()
);

CREATE POLICY "Admins can update any profile (non-recursive)"
ON public.profiles
FOR UPDATE
USING (
  (auth.uid() = user_id) OR 
  public.is_current_user_admin()
);

-- Recreate admin_users policies without recursion
CREATE POLICY "Admin users can view all admin users (non-recursive)"
ON public.admin_users
FOR SELECT
USING (public.is_current_user_admin());

-- Clean up any test client data
DELETE FROM public.clients WHERE phone = '1111111111' OR client_code LIKE 'TEST%' OR full_name LIKE '%Test%';

-- Remove any orphaned check-in logs for deleted clients
DELETE FROM public.check_in_logs WHERE client_id NOT IN (SELECT id FROM public.clients);

-- Create initial super admin user setup function
CREATE OR REPLACE FUNCTION public.create_super_admin(
  p_email text,
  p_password text,
  p_full_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  signup_result record;
BEGIN
  -- This function should only be called when no admin users exist
  IF EXISTS (SELECT 1 FROM public.profiles WHERE role IN ('admin', 'ceo')) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Admin user already exists. Cannot create additional super admin.'
    );
  END IF;
  
  -- Note: This function provides the structure but actual user creation
  -- should be done through Supabase Auth admin functions
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Super admin creation must be done through Supabase Auth admin panel first, then profile will be created automatically.'
  );
END;
$$;