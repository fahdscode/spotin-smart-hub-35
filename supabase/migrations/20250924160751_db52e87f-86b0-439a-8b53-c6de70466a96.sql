-- Drop the problematic function and policies
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can create check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Staff can update check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Staff can view all check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Staff can update session line items" ON public.session_line_items;
DROP POLICY IF EXISTS "Staff can view all session line items" ON public.session_line_items;

-- Create a simpler, non-recursive security definer function
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ceo', 'operations_manager', 'finance_manager', 'community_manager', 'receptionist', 'barista')
  );
$$;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'ceo')
  );
$$;

-- Recreate policies with simpler logic to avoid recursion
CREATE POLICY "Staff can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role IN ('admin', 'ceo', 'operations_manager', 'finance_manager', 'community_manager', 'receptionist', 'barista')
  )
);

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role IN ('admin', 'ceo')
  )
);

-- Recreate other policies
CREATE POLICY "Staff can create check-ins" 
ON public.check_ins 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR is_admin_or_staff()
);

CREATE POLICY "Staff can update check-ins" 
ON public.check_ins 
FOR UPDATE 
USING (
  auth.uid() = user_id OR is_admin_or_staff()
);

CREATE POLICY "Staff can view all check-ins" 
ON public.check_ins 
FOR SELECT 
USING (
  auth.uid() = user_id OR is_admin_or_staff()
);

CREATE POLICY "Staff can update session line items" 
ON public.session_line_items 
FOR UPDATE 
USING (
  auth.uid() = user_id OR is_admin_or_staff()
);

CREATE POLICY "Staff can view all session line items" 
ON public.session_line_items 
FOR SELECT 
USING (
  auth.uid() = user_id OR is_admin_or_staff()
);