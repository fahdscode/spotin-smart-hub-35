-- Remove all foreign key constraints that reference auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_user_id_fkey;

-- Clean up any existing data
DELETE FROM public.profiles WHERE email IN ('demo@spotin.com', 'mohamedbakr.5957@gmail.com');
DELETE FROM public.admin_users WHERE email IN ('demo@spotin.com', 'mohamedbakr.5957@gmail.com');

-- Generate a consistent UUID for the super admin
DO $$
DECLARE
    admin_uuid uuid := '00000000-0000-4000-8000-000000000001'::uuid;
BEGIN
    -- Create super admin profile
    INSERT INTO public.profiles (user_id, email, full_name, role, is_admin, phone, barcode)
    VALUES (
        admin_uuid,
        'mohamedbakr.5957@gmail.com', 
        'Mohamed Bakr', 
        'admin', 
        true,
        null,
        'ADMIN001'
    );

    -- Create corresponding admin_users entry
    INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
    VALUES (
        admin_uuid,
        'mohamedbakr.5957@gmail.com', 
        'Mohamed Bakr', 
        'admin', 
        true
    );
END $$;