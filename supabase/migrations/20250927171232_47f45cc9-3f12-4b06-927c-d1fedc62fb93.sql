-- Clean up any existing demo data
DELETE FROM public.admin_users WHERE email = 'ceo@demo.com';
DELETE FROM public.profiles WHERE email = 'ceo@demo.com';

-- Note: The actual super admin user creation should be done via the create-admin edge function
-- This migration just ensures clean state and provides the setup function for later use

CREATE OR REPLACE FUNCTION public.setup_super_admin_profile(
  p_user_id uuid,
  p_email text,
  p_full_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table (user must exist in auth.users first)
  INSERT INTO public.profiles (user_id, email, full_name, role, is_admin)
  VALUES (p_user_id, p_email, p_full_name, 'admin', true)
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = 'admin',
    is_admin = true;
    
  -- Insert into admin_users table
  INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
  VALUES (p_user_id, p_email, p_full_name, 'admin', true)
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = 'admin',
    is_active = true;
    
  -- Log the event
  PERFORM log_system_event(
    'info',
    'admin_setup',
    'Super admin account created: ' || p_full_name,
    jsonb_build_object('email', p_email, 'role', 'admin'),
    p_user_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Super admin profile setup completed'
  );
END;
$$;