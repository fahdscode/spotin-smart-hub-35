-- Fix the toggle_client_checkin_status function to properly handle errors and uninitialized variables
CREATE OR REPLACE FUNCTION public.toggle_client_checkin_status(p_barcode text, p_scanned_by_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    client_record record;
    trimmed_barcode text;
    action_taken text;
    checkin_id uuid;
    debug_info jsonb;
    found_client_id uuid := NULL;
BEGIN
    -- Trim input thoroughly (spaces, tabs, newlines, etc.)
    trimmed_barcode := TRIM(BOTH E' \n\r\t' FROM p_barcode);
    
    -- Log what we're searching for
    debug_info := jsonb_build_object(
        'original_input', p_barcode,
        'trimmed_input', trimmed_barcode,
        'input_length', LENGTH(trimmed_barcode)
    );
    
    -- Lock the client row to prevent concurrent modifications
    -- Use both barcode and client_code for compatibility
    SELECT id, client_code, full_name, phone, email, barcode, is_active, active
    INTO client_record
    FROM public.clients
    WHERE (barcode = trimmed_barcode OR client_code = trimmed_barcode) 
    AND is_active = true
    FOR UPDATE;
    
    -- Store client_id for use in exception handler
    IF client_record.id IS NOT NULL THEN
        found_client_id := client_record.id;
    END IF;
    
    -- Check if client exists and log the result
    IF client_record.id IS NULL THEN
        -- Log debugging info for failed barcode lookup - but only if we have a valid scanned_by_user_id
        IF p_scanned_by_user_id IS NOT NULL THEN
            INSERT INTO public.check_in_logs (client_id, action, scanned_barcode, scanned_by_user_id, notes)
            VALUES (NULL, 'failed_lookup', trimmed_barcode, p_scanned_by_user_id, 
                    'Barcode not found. Debug: ' || debug_info::text);
        END IF;
        
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Invalid barcode. Please try again.',
            'debug', debug_info
        );
    END IF;
    
    -- Add found client info to debug
    debug_info := debug_info || jsonb_build_object(
        'found_client_id', client_record.id,
        'found_barcode', client_record.barcode,
        'found_client_code', client_record.client_code,
        'current_active_status', client_record.active,
        'client_name', client_record.full_name
    );
    
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
    
    -- Log the successful action with debug info (now that we have a valid client_id)
    INSERT INTO public.check_in_logs (client_id, action, scanned_barcode, scanned_by_user_id, notes)
    VALUES (client_record.id, action_taken, trimmed_barcode, p_scanned_by_user_id, 
            'Successful ' || action_taken || '. Debug: ' || debug_info::text);
    
    RETURN jsonb_build_object(
        'success', true,
        'action', action_taken,
        'debug', debug_info,
        'client', jsonb_build_object(
            'id', client_record.id,
            'client_code', client_record.client_code,
            'full_name', client_record.full_name,
            'phone', client_record.phone,
            'email', client_record.email,
            'barcode', client_record.barcode,
            'active', NOT client_record.active -- Return the NEW status
        )
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error with debug info - using found_client_id which is properly initialized
    IF p_scanned_by_user_id IS NOT NULL THEN
        INSERT INTO public.check_in_logs (client_id, action, scanned_barcode, scanned_by_user_id, notes)
        VALUES (found_client_id, 'system_error', trimmed_barcode, p_scanned_by_user_id, 
                'System error: ' || SQLERRM || '. Debug: ' || COALESCE(debug_info::text, 'No debug info available'));
    END IF;
    
    RETURN jsonb_build_object(
        'success', false, 
        'error', 'System error. Please try again.',
        'debug', COALESCE(debug_info, '{}')  || jsonb_build_object('sql_error', SQLERRM)
    );
END;
$function$;