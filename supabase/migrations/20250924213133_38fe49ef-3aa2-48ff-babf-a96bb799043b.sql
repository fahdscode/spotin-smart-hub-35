-- Create function to toggle check-in status with proper locking
CREATE OR REPLACE FUNCTION public.toggle_client_checkin_status(p_barcode text, p_scanned_by_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    client_record record;
    trimmed_barcode text;
    action_taken text;
    checkin_id uuid;
BEGIN
    -- Trim input
    trimmed_barcode := TRIM(BOTH E' \n\r\t' FROM p_barcode);
    
    -- Lock the client row to prevent concurrent modifications
    SELECT id, client_code, full_name, phone, email, barcode, is_active, active
    INTO client_record
    FROM public.clients
    WHERE barcode = trimmed_barcode AND is_active = true
    FOR UPDATE;
    
    -- Check if client exists
    IF client_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid barcode. Please try again.');
    END IF;
    
    -- Determine action based on current status
    IF client_record.active THEN
        -- Client is checked in, perform check-out
        action_taken := 'checked_out';
        
        -- Update client active status
        UPDATE public.clients 
        SET active = false, updated_at = NOW() 
        WHERE id = client_record.id;
        
        -- Update current check-in record
        UPDATE public.check_ins 
        SET status = 'checked_out', checked_out_at = NOW() 
        WHERE client_id = client_record.id 
        AND status = 'checked_in' 
        AND checked_out_at IS NULL;
        
    ELSE
        -- Client is checked out, perform check-in
        action_taken := 'checked_in';
        
        -- Update client active status
        UPDATE public.clients 
        SET active = true, updated_at = NOW() 
        WHERE id = client_record.id;
        
        -- Create new check-in record
        INSERT INTO public.check_ins (client_id, user_id, status, checked_in_at)
        VALUES (client_record.id, COALESCE(p_scanned_by_user_id, client_record.id), 'checked_in', NOW())
        RETURNING id INTO checkin_id;
    END IF;
    
    -- Log the action
    INSERT INTO public.check_in_logs (client_id, action, scanned_barcode, scanned_by_user_id, notes)
    VALUES (client_record.id, action_taken, trimmed_barcode, p_scanned_by_user_id, 'Barcode scan check-in/out');
    
    RETURN jsonb_build_object(
        'success', true,
        'action', action_taken,
        'client', jsonb_build_object(
            'id', client_record.id,
            'client_code', client_record.client_code,
            'full_name', client_record.full_name,
            'phone', client_record.phone,
            'email', client_record.email,
            'barcode', client_record.barcode,
            'active', NOT client_record.active
        )
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'System error. Please try again.');
END;
$$;