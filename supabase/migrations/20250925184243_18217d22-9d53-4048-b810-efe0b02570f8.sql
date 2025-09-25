-- Add new columns to clients table for comprehensive registration data
ALTER TABLE public.clients 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN job_title TEXT,
ADD COLUMN how_did_you_find_us TEXT;

-- Update existing clients by splitting full_name into first_name and last_name
UPDATE public.clients 
SET 
  first_name = TRIM(SPLIT_PART(full_name, ' ', 1)),
  last_name = CASE 
    WHEN POSITION(' ' IN full_name) > 0 
    THEN TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
    ELSE ''
  END,
  job_title = 'Not specified',
  how_did_you_find_us = 'Existing client'
WHERE first_name IS NULL;

-- Make new columns NOT NULL after updating existing data
ALTER TABLE public.clients 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL,
ALTER COLUMN job_title SET NOT NULL,
ALTER COLUMN how_did_you_find_us SET NOT NULL;

-- Create updated registration function with new fields
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
SET search_path TO 'public'
AS $function$
DECLARE
    new_client_id uuid;
    new_client_code text;
    new_barcode text;
    barcode_attempts integer := 0;
    max_attempts integer := 10;
    generated_full_name text;
BEGIN
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
      p_password_hash, 
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
$function$;

-- Update authenticate_client function to return new fields
CREATE OR REPLACE FUNCTION public.authenticate_client(client_phone text, client_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    client_record record;
BEGIN
    -- Find client by phone
    SELECT 
      id, 
      client_code, 
      first_name,
      last_name,
      full_name, 
      phone, 
      email, 
      password_hash, 
      is_active, 
      barcode,
      job_title,
      how_did_you_find_us
    INTO client_record
    FROM public.clients
    WHERE phone = client_phone AND is_active = true;
    
    -- Check if client exists
    IF client_record.id IS NOT NULL THEN
        -- Return client data with password hash for client-side verification
        RETURN jsonb_build_object(
            'success', true,
            'client', jsonb_build_object(
                'id', client_record.id,
                'client_code', client_record.client_code,
                'first_name', client_record.first_name,
                'last_name', client_record.last_name,
                'full_name', client_record.full_name,
                'phone', client_record.phone,
                'email', client_record.email,
                'barcode', client_record.barcode,
                'job_title', client_record.job_title,
                'how_did_you_find_us', client_record.how_did_you_find_us,
                'password_hash', client_record.password_hash
            )
        );
    ELSE
        -- Return failure for non-existent client
        RETURN jsonb_build_object('success', false, 'error', 'Invalid phone number or password');
    END IF;
END;
$function$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_first_name ON public.clients(first_name);
CREATE INDEX IF NOT EXISTS idx_clients_last_name ON public.clients(last_name);
CREATE INDEX IF NOT EXISTS idx_clients_job_title ON public.clients(job_title);