-- Fix: Ensure every ticket assignment creates a check_ins record for visit tracking
-- This ensures all check-ins are properly counted in analytics

CREATE OR REPLACE FUNCTION public.assign_ticket_to_client(
  p_client_id UUID,
  p_ticket_id UUID,
  p_payment_method TEXT DEFAULT 'cash',
  p_duration_hours INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ticket_data RECORD;
  new_ticket_id UUID;
  new_checkin_id UUID;
BEGIN
  -- Get ticket details
  SELECT * INTO ticket_data
  FROM public.drinks
  WHERE id = p_ticket_id AND category = 'day_use_ticket' AND is_available = true;
  
  IF ticket_data.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or unavailable ticket');
  END IF;
  
  -- Deactivate any existing active tickets
  UPDATE public.client_tickets
  SET is_active = false
  WHERE client_id = p_client_id AND is_active = true;
  
  -- Create new ticket record
  INSERT INTO public.client_tickets (
    client_id, ticket_id, payment_method, expiry_date, checked_in_at
  )
  VALUES (
    p_client_id, p_ticket_id, p_payment_method, NOW() + (p_duration_hours || ' hours')::INTERVAL, NOW()
  )
  RETURNING id INTO new_ticket_id;
  
  -- CRITICAL: Create check_ins record to count this as a visit for analytics
  INSERT INTO public.check_ins (
    client_id,
    status,
    checked_in_at
  )
  VALUES (
    p_client_id,
    'checked_in',
    NOW()
  )
  RETURNING id INTO new_checkin_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'ticket_id', new_ticket_id,
    'checkin_id', new_checkin_id,
    'ticket_name', ticket_data.name,
    'ticket_price', ticket_data.price,
    'expiry_date', NOW() + (p_duration_hours || ' hours')::INTERVAL
  );
END;
$$;