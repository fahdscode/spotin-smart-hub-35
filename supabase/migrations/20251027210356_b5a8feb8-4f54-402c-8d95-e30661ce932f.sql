-- Create secure client password verification function
-- This bypasses RLS to verify client credentials and return client data

CREATE OR REPLACE FUNCTION public.verify_client_password(
  p_phone text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  client_record record;
  password_match boolean;
BEGIN
  -- Find client by phone (handle different phone formats)
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
  WHERE (phone = p_phone OR phone = '+' || p_phone OR REPLACE(phone, '+', '') = p_phone)
  AND is_active = true;
  
  -- Check if client exists
  IF client_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid phone number or password'
    );
  END IF;
  
  -- Verify password using crypt function from pgcrypto
  -- The password_hash was created with crypt(password, gen_salt('bf', 10))
  -- To verify, we use crypt(input_password, stored_hash) and compare with stored_hash
  password_match := (crypt(p_password, client_record.password_hash) = client_record.password_hash);
  
  IF NOT password_match THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Invalid phone number or password'
    );
  END IF;
  
  -- Return client data WITHOUT password hash (SECURE)
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
      'how_did_you_find_us', client_record.how_did_you_find_us
    )
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 
    'error', 'Login error: ' || SQLERRM
  );
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.verify_client_password(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_client_password(text, text) TO authenticated;