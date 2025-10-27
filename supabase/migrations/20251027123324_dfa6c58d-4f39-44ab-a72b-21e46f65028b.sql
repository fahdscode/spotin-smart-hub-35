-- Create client_tickets table
CREATE TABLE IF NOT EXISTS public.client_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.drinks(id) ON DELETE CASCADE,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  used_at TIMESTAMP WITH TIME ZONE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_tickets_client_id ON public.client_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tickets_active ON public.client_tickets(is_active, expiry_date);
CREATE INDEX IF NOT EXISTS idx_client_tickets_ticket_id ON public.client_tickets(ticket_id);

-- Enable RLS
ALTER TABLE public.client_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can view their own tickets"
ON public.client_tickets
FOR SELECT
USING (
  (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = client_tickets.client_id AND clients.is_active = true))
  OR is_admin_or_staff()
);

CREATE POLICY "Staff can manage client tickets"
ON public.client_tickets
FOR ALL
USING (is_admin_or_staff());

-- Function to get active ticket for a client
CREATE OR REPLACE FUNCTION public.get_client_active_ticket(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', ct.id,
    'ticket_name', d.name,
    'ticket_price', d.price,
    'ticket_description', d.description,
    'includes_free_drink', COALESCE(d.ingredients @> ARRAY['free_drink']::text[], false),
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
$$;

-- Function to assign ticket to client
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
  
  RETURN jsonb_build_object(
    'success', true,
    'ticket_id', new_ticket_id,
    'ticket_name', ticket_data.name,
    'ticket_price', ticket_data.price,
    'expiry_date', NOW() + (p_duration_hours || ' hours')::INTERVAL
  );
END;
$$;

-- Function to get all available tickets
CREATE OR REPLACE FUNCTION public.get_available_tickets()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'price', price,
      'description', description,
      'includes_free_drink', COALESCE(ingredients @> ARRAY['free_drink']::text[], false),
      'image_url', image_url
    ) ORDER BY price
  )
  INTO result
  FROM public.drinks
  WHERE category = 'day_use_ticket' AND is_available = true;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;