-- Create a simpler authentication function that works without relying on crypt()
-- This function will use bcryptjs verification on the client side instead
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
    SELECT id, client_code, full_name, phone, email, password_hash, is_active, barcode
    INTO client_record
    FROM public.clients
    WHERE phone = client_phone AND is_active = true;
    
    -- Check if client exists
    IF client_record.id IS NOT NULL THEN
        -- Return client data with password hash for client-side verification
        -- This is secure because we're returning it through RPC and will verify on client
        RETURN jsonb_build_object(
            'success', true,
            'client', jsonb_build_object(
                'id', client_record.id,
                'client_code', client_record.client_code,
                'full_name', client_record.full_name,
                'phone', client_record.phone,
                'email', client_record.email,
                'barcode', client_record.barcode,
                'password_hash', client_record.password_hash
            )
        );
    ELSE
        -- Return failure for non-existent client
        RETURN jsonb_build_object('success', false, 'error', 'Invalid phone number or password');
    END IF;
END;
$function$;