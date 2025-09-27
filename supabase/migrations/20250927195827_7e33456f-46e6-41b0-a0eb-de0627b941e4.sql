-- Create function to validate if user_id belongs to an active client
CREATE OR REPLACE FUNCTION public.is_valid_client_id(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = check_user_id 
    AND is_active = true
  );
$$;

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can create their own orders" ON public.session_line_items;

-- Create new policy that allows both Supabase Auth users and valid clients
CREATE POLICY "Users and clients can create orders" 
ON public.session_line_items 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated via Supabase Auth
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Allow if user_id is a valid client (for custom client auth)
  (is_valid_client_id(user_id))
);

-- Update SELECT policy to allow clients to see their orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.session_line_items;

CREATE POLICY "Users and clients can view their orders" 
ON public.session_line_items 
FOR SELECT 
USING (
  -- Allow if user is authenticated via Supabase Auth
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Allow if user_id is a valid client
  (is_valid_client_id(user_id))
  OR
  -- Allow staff to see all orders
  is_admin_or_staff()
);