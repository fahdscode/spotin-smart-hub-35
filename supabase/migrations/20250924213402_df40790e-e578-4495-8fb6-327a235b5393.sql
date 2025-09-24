-- Update the test_client_registration function to use new barcode generation
CREATE OR REPLACE FUNCTION public.test_client_registration(p_full_name text, p_phone text, p_email text, p_password_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_client_id uuid;
    new_client_code text;
    new_barcode text;
BEGIN
    -- Generate unique client code
    new_client_code := generate_client_code();
    
    -- Generate unique barcode using the new function
    new_barcode := generate_unique_barcode();
    
    -- Insert new client with active = false by default
    INSERT INTO public.clients (full_name, phone, email, password_hash, client_code, barcode, active)
    VALUES (p_full_name, p_phone, p_email, p_password_hash, new_client_code, new_barcode, false)
    RETURNING id INTO new_client_id;
    
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
        'error', 'Could not create account. Please try again.',
        'error_detail', SQLSTATE
    );
END;
$$;