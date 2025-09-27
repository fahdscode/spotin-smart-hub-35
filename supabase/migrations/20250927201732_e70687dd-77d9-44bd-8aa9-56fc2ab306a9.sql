-- Add DELETE policy for order cancellation by staff
CREATE POLICY "Staff can delete orders" 
ON public.session_line_items 
FOR DELETE 
USING (is_admin_or_staff());

-- Also ensure staff can update order status (including cancelled)
DROP POLICY IF EXISTS "Staff can update session line items" ON public.session_line_items;

CREATE POLICY "Staff can update session line items" 
ON public.session_line_items 
FOR UPDATE 
USING (is_admin_or_staff());