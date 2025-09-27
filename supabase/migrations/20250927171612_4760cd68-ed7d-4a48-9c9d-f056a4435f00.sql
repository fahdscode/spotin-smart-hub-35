-- Clean up incorrect super admin data and demo data
DELETE FROM public.clients WHERE email = 'mohamedbakr.5957@gmail.com';
DELETE FROM public.profiles WHERE email = 'demo@spotin.com';

-- Note: Super admin will be created properly via the create-admin edge function
-- This ensures the user exists in auth.users first, then profiles table