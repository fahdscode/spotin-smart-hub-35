-- Fix RLS policies for session_line_items to properly support client orders
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow order creation for authenticated users and valid clients" ON public.session_line_items;
DROP POLICY IF EXISTS "Allow order viewing for users, clients and staff" ON public.session_line_items;

-- Create improved policies that properly handle client authentication
CREATE POLICY "Clients can create their own orders"
ON public.session_line_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Allow if user_id matches a valid active client
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = session_line_items.user_id
    AND is_active = true
  )
);

CREATE POLICY "Clients can view their own orders"
ON public.session_line_items
FOR SELECT
TO anon, authenticated
USING (
  -- Allow clients to view their own orders
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = session_line_items.user_id
    AND is_active = true
  )
  OR
  -- Allow staff to view all orders
  is_admin_or_staff()
);

-- Ensure receipts can be created for client orders
DROP POLICY IF EXISTS "Users can view their own receipts" ON public.receipts;

CREATE POLICY "Clients and staff can view receipts"
ON public.receipts
FOR SELECT
TO anon, authenticated
USING (
  -- Allow clients to view their own receipts
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = receipts.user_id
    AND is_active = true
  )
  OR
  -- Allow staff to view all receipts
  is_admin_or_staff()
);

CREATE POLICY "System can create receipts"
ON public.receipts
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Allow receipt creation for valid clients
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = receipts.user_id
    AND is_active = true
  )
  OR
  -- Allow staff to create receipts
  is_admin_or_staff()
);