-- Add max_free_drink_price column to drinks table
ALTER TABLE public.drinks 
ADD COLUMN IF NOT EXISTS max_free_drink_price NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.drinks.max_free_drink_price IS 'Maximum price allowed for free drink redemption (only applicable for tickets with free drinks)';

-- Add columns to track free drink claims in client_tickets
ALTER TABLE public.client_tickets 
ADD COLUMN IF NOT EXISTS free_drink_claimed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS free_drink_claimed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS claimed_drink_name TEXT;

COMMENT ON COLUMN public.client_tickets.free_drink_claimed IS 'Whether the free drink has been claimed';
COMMENT ON COLUMN public.client_tickets.free_drink_claimed_at IS 'Timestamp when the free drink was claimed';
COMMENT ON COLUMN public.client_tickets.claimed_drink_name IS 'Name of the drink that was claimed';

-- Update the get_client_active_ticket function to include new fields
CREATE OR REPLACE FUNCTION public.get_client_active_ticket(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', ct.id,
    'ticket_name', d.name,
    'ticket_price', d.price,
    'ticket_description', d.description,
    'includes_free_drink', COALESCE(d.ingredients @> ARRAY['free_drink']::text[], false),
    'max_free_drink_price', COALESCE(d.max_free_drink_price, 0),
    'free_drink_claimed', COALESCE(ct.free_drink_claimed, false),
    'free_drink_claimed_at', ct.free_drink_claimed_at,
    'claimed_drink_name', ct.claimed_drink_name,
    'purchase_date', ct.purchase_date,
    'expiry_date', ct.expiry_date,
    'checked_in_at', ct.checked_in_at,
    'hours_remaining', EXTRACT(EPOCH FROM (ct.expiry_date - NOW()))/3600
  )
  INTO result
  FROM public.client_tickets ct
  JOIN public.drinks d ON ct.ticket_id = d.id
  WHERE ct.client_id = p_client_id
  AND ct.is_active = true
  AND ct.expiry_date > NOW()
  ORDER BY ct.purchase_date DESC
  LIMIT 1;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$function$;

-- Create function to get client ticket info for barista dashboard
CREATE OR REPLACE FUNCTION public.get_client_ticket_info(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'has_active_ticket', true,
    'ticket_name', d.name,
    'includes_free_drink', COALESCE(d.ingredients @> ARRAY['free_drink']::text[], false),
    'max_free_drink_price', COALESCE(d.max_free_drink_price, 0),
    'free_drink_claimed', COALESCE(ct.free_drink_claimed, false),
    'expiry_date', ct.expiry_date
  )
  INTO result
  FROM public.client_tickets ct
  JOIN public.drinks d ON ct.ticket_id = d.id
  WHERE ct.client_id = p_client_id
  AND ct.is_active = true
  AND ct.expiry_date > NOW()
  ORDER BY ct.purchase_date DESC
  LIMIT 1;
  
  RETURN COALESCE(result, jsonb_build_object('has_active_ticket', false));
END;
$function$;