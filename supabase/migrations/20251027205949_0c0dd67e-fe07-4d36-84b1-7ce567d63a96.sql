-- Fix the test_client_registration function to use proper gen_salt syntax
-- The gen_salt function requires explicit casting for the algorithm parameter

CREATE OR REPLACE FUNCTION public.test_client_registration(
  p_first_name text, 
  p_last_name text, 
  p_phone text, 
  p_email text, 
  p_password_hash text, 
  p_job_title text, 
  p_how_did_you_find_us text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_client_id uuid;
    new_client_code text;
    new_barcode text;
    barcode_attempts integer := 0;
    max_attempts integer := 10;
    generated_full_name text;
    hashed_password text;
BEGIN
    -- Hash the password server-side using pgcrypto with proper casting
    hashed_password := crypt(p_password_hash, gen_salt('bf'::text, 10));
    
    -- Generate full name from first and last name
    generated_full_name := TRIM(p_first_name || ' ' || p_last_name);
    
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
    
    -- Insert new client with all required fields
    INSERT INTO public.clients (
      first_name, 
      last_name, 
      full_name, 
      phone, 
      email, 
      password_hash, 
      client_code, 
      barcode, 
      job_title, 
      how_did_you_find_us, 
      active
    )
    VALUES (
      p_first_name, 
      p_last_name, 
      generated_full_name, 
      p_phone, 
      p_email, 
      hashed_password, -- Use server-hashed password
      new_client_code, 
      new_barcode, 
      p_job_title, 
      p_how_did_you_find_us, 
      false
    )
    RETURNING id INTO new_client_id;
    
    -- Log the registration
    INSERT INTO public.check_in_logs (client_id, action, scanned_barcode, scanned_by_user_id, notes)
    VALUES (new_client_id, 'registered', new_barcode, NULL, 
            'Client registered: ' || generated_full_name || ' (' || p_job_title || ')');
    
    RETURN jsonb_build_object(
        'success', true,
        'client_id', new_client_id,
        'client_code', new_client_code,
        'barcode', new_barcode,
        'full_name', generated_full_name,
        'message', 'Client registration successful'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Could not create account: ' || SQLERRM,
        'error_detail', SQLSTATE
    );
END;
$$;