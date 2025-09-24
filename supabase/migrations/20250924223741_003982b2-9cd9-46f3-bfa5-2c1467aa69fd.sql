-- Fix the toggle_client_checkin_status function with proper debugging and error handling
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
    SELECT id, client_code, full_name, phone, email, barcode, is_active, active
    INTO client_record
    FROM public.clients
    WHERE barcode = trimmed_barcode AND is_active = true
    FOR UPDATE;
    
    -- Check if client exists and log the result
    IF client_record.id IS NULL THEN
        -- Log debugging info for failed barcode lookup
        INSERT INTO public.check_in_logs (client_id, action, scanned_barcode, scanned_by_user_id, notes)
        VALUES (NULL, 'failed_lookup', trimmed_barcode, p_scanned_by_user_id, 
                'Barcode not found. Debug: ' || debug_info::text);
        
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
    
    -- Log the successful action with debug info
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
    -- Log the error with debug info
    INSERT INTO public.check_in_logs (client_id, action, scanned_barcode, scanned_by_user_id, notes)
    VALUES (NULL, 'system_error', trimmed_barcode, p_scanned_by_user_id, 
            'System error: ' || SQLERRM || '. Debug: ' || debug_info::text);
    
    RETURN jsonb_build_object(
        'success', false, 
        'error', 'System error. Please try again.',
        'debug', debug_info || jsonb_build_object('sql_error', SQLERRM)
    );
END;
$function$;

-- Ensure the barcode column has a unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_barcode_unique ON public.clients(barcode) WHERE is_active = true;

-- Create index on check_in_logs for debugging queries
CREATE INDEX IF NOT EXISTS idx_check_in_logs_debug ON public.check_in_logs(scanned_barcode, timestamp DESC);

-- Update the client registration function to ensure proper barcode generation
CREATE OR REPLACE FUNCTION public.test_client_registration(p_full_name text, p_phone text, p_email text, p_password_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_client_id uuid;
    new_client_code text;
    new_barcode text;
    barcode_attempts integer := 0;
    max_attempts integer := 10;
BEGIN
    -- Generate unique client code
    new_client_code := generate_client_code();
    
    -- Generate unique barcode with retry logic
    LOOP
        barcode_attempts := barcode_attempts + 1;
        new_barcode := generate_unique_barcode();
        
        -- Check if this barcode already exists
        IF NOT EXISTS(SELECT 1 FROM public.clients WHERE barcode = new_barcode) THEN
            EXIT; -- Barcode is unique, exit loop
        END IF;
        
        -- Safety check to prevent infinite loop
        IF barcode_attempts >= max_attempts THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Could not generate unique barcode after ' || max_attempts || ' attempts'
            );
        END IF;
    END LOOP;
    
    -- Insert new client with active = false by default
    INSERT INTO public.clients (full_name, phone, email, password_hash, client_code, barcode, active)
    VALUES (p_full_name, p_phone, p_email, p_password_hash, new_client_code, new_barcode, false)
    RETURNING id INTO new_client_id;
    
    -- Log the registration
    INSERT INTO public.check_in_logs (client_id, action, scanned_barcode, scanned_by_user_id, notes)
    VALUES (new_client_id, 'registered', new_barcode, NULL, 
            'Client registered with barcode: ' || new_barcode);
    
    RETURN jsonb_build_object(
        'success', true,
        'client_id', new_client_id,
        'client_code', new_client_code,
        'barcode', new_barcode,
        'message', 'Client registration successful'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Could not create account: ' || SQLERRM,
        'error_detail', SQLSTATE
    );
END;
$function$;