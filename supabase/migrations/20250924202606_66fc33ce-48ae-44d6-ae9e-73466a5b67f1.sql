-- Fix password verification to work with bcryptjs hashes
-- and ensure proper client authentication

-- Update the authenticate_client function to work with bcryptjs
CREATE OR REPLACE FUNCTION public.authenticate_client(client_phone text, client_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    client_record record;
    is_valid boolean := false;
BEGIN
    -- Find client by phone
    SELECT id, client_code, full_name, phone, email, password_hash, is_active, barcode
    INTO client_record
    FROM public.clients
    WHERE phone = client_phone AND is_active = true;
    
    -- Check if client exists and verify password
    IF client_record.id IS NOT NULL THEN
        -- For bcryptjs compatibility, we need to check if the hash starts with $2a$, $2b$, or $2y$
        -- bcryptjs produces hashes that start with $2a$, $2b$, or $2y$
        IF client_record.password_hash ~ '^\$2[ayb]\$' THEN
            -- Use crypt for bcrypt hashes (bcryptjs compatible)
            SELECT crypt(client_password, client_record.password_hash) = client_record.password_hash
            INTO is_valid;
        ELSE
            -- Fallback for other hash types
            SELECT client_record.password_hash = client_password INTO is_valid;
        END IF;
        
        IF is_valid THEN
            -- Return client data (excluding password hash)
            RETURN jsonb_build_object(
                'success', true,
                'client', jsonb_build_object(
                    'id', client_record.id,
                    'client_code', client_record.client_code,
                    'full_name', client_record.full_name,
                    'phone', client_record.phone,
                    'email', client_record.email,
                    'barcode', client_record.barcode
                )
            );
        END IF;
    END IF;
    
    -- Return failure
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
END;
$$;

-- Update the insert policy to be more permissive for client registration
DROP POLICY IF EXISTS "Allow client registration" ON public.clients;

CREATE POLICY "Allow client registration" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  -- Allow insert with required fields for client registration
  full_name IS NOT NULL 
  AND phone IS NOT NULL 
  AND password_hash IS NOT NULL 
  AND client_code IS NOT NULL 
  AND barcode IS NOT NULL
);

-- Create a function to verify client registration works (fix parameter syntax)
CREATE OR REPLACE FUNCTION public.test_client_registration(
    p_full_name text,
    p_phone text,
    p_email text,
    p_password_hash text,
    p_client_code text,
    p_barcode text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_client_id uuid;
BEGIN
    -- Try to insert the client
    INSERT INTO public.clients (full_name, phone, email, password_hash, client_code, barcode)
    VALUES (p_full_name, p_phone, p_email, p_password_hash, p_client_code, p_barcode)
    RETURNING id INTO new_client_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'client_id', new_client_id,
        'message', 'Client registration successful'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_detail', SQLSTATE
    );
END;
$$;