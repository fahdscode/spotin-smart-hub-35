-- Fix security warnings by setting search_path for functions

-- Update generate_client_code function
CREATE OR REPLACE FUNCTION public.generate_client_code()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    new_code TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM now())::TEXT;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
        CASE 
            WHEN client_code ~ ('^C-' || year_part || '-[0-9]+$') 
            THEN CAST(SUBSTRING(client_code FROM '^C-' || year_part || '-([0-9]+)$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM public.clients;
    
    new_code := 'C-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN new_code;
END;
$$;

-- Update generate_barcode_for_client function
CREATE OR REPLACE FUNCTION public.generate_barcode_for_client(client_code TEXT)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Simply return the client code as the barcode content
    -- This will be encoded by the frontend barcode library
    RETURN client_code;
END;
$$;

-- Update get_client_status function
CREATE OR REPLACE FUNCTION public.get_client_status(client_id UUID)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    last_action TEXT;
BEGIN
    SELECT action INTO last_action
    FROM public.check_in_logs
    WHERE client_id = get_client_status.client_id
    ORDER BY timestamp DESC
    LIMIT 1;
    
    RETURN COALESCE(last_action, 'checked_out');
END;
$$;