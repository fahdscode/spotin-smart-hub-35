-- First, add 'cancelled' to the allowed status values
ALTER TABLE session_line_items DROP CONSTRAINT IF EXISTS session_line_items_status_check;

ALTER TABLE session_line_items ADD CONSTRAINT session_line_items_status_check 
CHECK (status IN ('pending', 'preparing', 'completed', 'served', 'cancelled'));

-- Create RPC function for barista to cancel orders securely
CREATE OR REPLACE FUNCTION public.cancel_order_item(
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the order status to cancelled
  UPDATE session_line_items
  SET status = 'cancelled'
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Order not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Order cancelled successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Failed to cancel order: ' || SQLERRM
    );
END;
$$;