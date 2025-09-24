-- Create unified checkout function that handles both check_ins and clients table updates
CREATE OR REPLACE FUNCTION public.checkout_client(p_client_id uuid, p_checkout_by_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    client_record record;
    checkin_record record;
BEGIN
    -- Lock the client row to prevent concurrent modifications
    SELECT id, client_code, full_name, phone, email, barcode, is_active, active
    INTO client_record
    FROM public.clients
    WHERE id = p_client_id AND is_active = true
    FOR UPDATE;
    
    -- Check if client exists
    IF client_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Client not found or inactive.');
    END IF;
    
    -- Check if client is actually checked in
    IF NOT client_record.active THEN
        RETURN jsonb_build_object('success', false, 'error', 'Client is already checked out.');
    END IF;
    
    -- Find the active check-in record
    SELECT id INTO checkin_record
    FROM public.check_ins
    WHERE client_id = p_client_id 
    AND status = 'checked_in' 
    AND checked_out_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Update client active status
    UPDATE public.clients 
    SET active = false, updated_at = NOW() 
    WHERE id = p_client_id;
    
    -- Update check-in record if it exists
    IF checkin_record.id IS NOT NULL THEN
        UPDATE public.check_ins 
        SET status = 'checked_out', checked_out_at = NOW() 
        WHERE id = checkin_record.id;
    END IF;
    
    -- Log the action
    INSERT INTO public.check_in_logs (client_id, action, scanned_barcode, scanned_by_user_id, notes)
    VALUES (p_client_id, 'checked_out', client_record.barcode, p_checkout_by_user_id, 'Manual checkout by staff');
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Client checked out successfully',
        'client', jsonb_build_object(
            'id', client_record.id,
            'client_code', client_record.client_code,
            'full_name', client_record.full_name,
            'phone', client_record.phone,
            'email', client_record.email,
            'barcode', client_record.barcode,
            'active', false
        )
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'System error during checkout. Please try again.');
END;
$function$;

-- Fix existing data inconsistencies
-- Set clients.active = false for clients who have checked_out status but active = true
UPDATE public.clients 
SET active = false, updated_at = NOW()
WHERE active = true 
AND id IN (
    SELECT DISTINCT client_id 
    FROM public.check_ins 
    WHERE status = 'checked_out' 
    AND client_id IS NOT NULL
    AND id IN (
        SELECT DISTINCT ON (client_id) id
        FROM public.check_ins
        WHERE client_id IS NOT NULL
        ORDER BY client_id, created_at DESC
    )
);

-- Set clients.active = true for clients who have checked_in status but active = false
UPDATE public.clients 
SET active = true, updated_at = NOW()
WHERE active = false 
AND id IN (
    SELECT DISTINCT client_id 
    FROM public.check_ins 
    WHERE status = 'checked_in' 
    AND checked_out_at IS NULL
    AND client_id IS NOT NULL
    AND id IN (
        SELECT DISTINCT ON (client_id) id
        FROM public.check_ins
        WHERE client_id IS NOT NULL
        ORDER BY client_id, created_at DESC
    )
);