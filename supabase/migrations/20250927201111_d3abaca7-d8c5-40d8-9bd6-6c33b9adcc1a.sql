-- Fix the RLS policy for session_line_items to properly handle client orders
-- The issue is that clients don't have auth.uid() but use client IDs directly

-- Drop existing policies that might be problematic
DROP POLICY IF EXISTS "Users and clients can create orders" ON public.session_line_items;
DROP POLICY IF EXISTS "Users and clients can view their orders" ON public.session_line_items;

-- Create improved policies that properly handle both authenticated users and clients
CREATE POLICY "Allow order creation for authenticated users and valid clients" 
ON public.session_line_items 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and matches user_id
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
  OR 
  -- Allow if user_id corresponds to a valid active client
  (auth.uid() IS NULL AND is_valid_client_id(user_id))
);

CREATE POLICY "Allow order viewing for users and staff" 
ON public.session_line_items 
FOR SELECT 
USING (
  -- Users can see their own orders
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
  OR 
  -- Staff can see all orders
  is_admin_or_staff()
  OR
  -- Allow viewing orders for valid clients (used by client portal)
  (auth.uid() IS NULL AND is_valid_client_id(user_id))
);

-- Enable real-time for session_line_items to ensure barista dashboard updates
ALTER TABLE public.session_line_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_line_items;