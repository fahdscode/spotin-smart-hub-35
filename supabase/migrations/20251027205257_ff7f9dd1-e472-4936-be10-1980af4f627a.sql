-- Create a security definer function to check if a user is an admin
-- This allows the login flow to verify admin status without hitting RLS policies

CREATE OR REPLACE FUNCTION public.check_user_is_admin(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record record;
BEGIN
  -- Query admin_users table with elevated privileges (bypasses RLS)
  SELECT role, is_active, email, full_name
  INTO admin_record
  FROM public.admin_users
  WHERE user_id = p_user_id
  AND is_active = true;
  
  -- If no admin record found, return null
  IF admin_record IS NULL THEN
    RETURN jsonb_build_object(
      'is_admin', false,
      'role', null
    );
  END IF;
  
  -- Return admin details
  RETURN jsonb_build_object(
    'is_admin', true,
    'role', admin_record.role,
    'email', admin_record.email,
    'full_name', admin_record.full_name
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_user_is_admin(uuid) TO authenticated;