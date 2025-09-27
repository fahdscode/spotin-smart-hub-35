-- Fix the INSERT policy for session_line_items
-- The issue is that INSERT policies need WITH CHECK, not USING

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Allow order creation for authenticated users and valid clients" ON public.session_line_items;

-- Create the correct INSERT policy with WITH CHECK
CREATE POLICY "Allow order creation for authenticated users and valid clients" 
ON public.session_line_items 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and matches user_id
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
  OR 
  -- Allow if user_id corresponds to a valid active client (for non-authenticated client portal)
  (auth.uid() IS NULL AND is_valid_client_id(user_id))
);

-- Also simplify the SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "Allow order viewing for users and staff" ON public.session_line_items;
DROP POLICY IF EXISTS "Staff can view all session line items" ON public.session_line_items;

-- Create a single comprehensive SELECT policy
CREATE POLICY "Allow order viewing for users, clients and staff" 
ON public.session_line_items 
FOR SELECT 
USING (
  -- Users can see their own orders
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
  OR 
  -- Staff can see all orders
  is_admin_or_staff()
  OR
  -- Valid clients can see their orders (for client portal)
  (auth.uid() IS NULL AND is_valid_client_id(user_id))
);