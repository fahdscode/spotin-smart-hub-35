-- Clean up orphaned profile records where user_id doesn't exist in Supabase Auth
-- This will restore the Super Admin Setup functionality

-- Delete orphaned records from admin_users table
DELETE FROM public.admin_users 
WHERE user_id NOT IN (
  SELECT id FROM auth.users
);

-- Delete orphaned records from profiles table  
DELETE FROM public.profiles 
WHERE user_id NOT IN (
  SELECT id FROM auth.users
);

-- Verify cleanup by checking if any admin exists
-- This should now return false, allowing Super Admin Setup to appear
SELECT check_admin_exists() as admin_exists_after_cleanup;