-- Fix critical security vulnerability: Remove public access to clients table
-- and implement proper access controls

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Clients can view their own profile" ON public.clients;
DROP POLICY IF EXISTS "Only system can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can update their own profile" ON public.clients;
DROP POLICY IF EXISTS "Staff can update clients" ON public.clients;

-- Create secure policies for clients table
-- Allow public signup (insert only with specific checks)
CREATE POLICY "Allow client registration" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  -- Only allow insert if all required fields are provided
  full_name IS NOT NULL 
  AND phone IS NOT NULL 
  AND password_hash IS NOT NULL 
  AND client_code IS NOT NULL 
  AND barcode IS NOT NULL
);

-- Clients cannot read their own data directly through the table
-- (Application will handle authentication and data access)
CREATE POLICY "No direct client table access" 
ON public.clients 
FOR SELECT 
USING (false);

-- Only authenticated staff can view all client data
CREATE POLICY "Staff view all clients" 
ON public.clients 
FOR SELECT 
USING (is_admin_or_staff());

-- Only authenticated staff can update client data
CREATE POLICY "Staff update clients" 
ON public.clients 
FOR UPDATE 
USING (is_admin_or_staff());

-- Create a secure function for client authentication
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
        -- Use pgcrypto to verify password (assuming bcrypt was used)
        SELECT crypt(client_password, client_record.password_hash) = client_record.password_hash
        INTO is_valid;
        
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

-- Create function to get client data by ID (for authenticated sessions)
CREATE OR REPLACE FUNCTION public.get_client_by_id(client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    client_record record;
BEGIN
    SELECT id, client_code, full_name, phone, email, barcode, is_active
    INTO client_record
    FROM public.clients
    WHERE id = client_id AND is_active = true;
    
    IF client_record.id IS NOT NULL THEN
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
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Client not found');
    END IF;
END;
$$;

-- Enable pgcrypto extension if not already enabled (for password verification)
CREATE EXTENSION IF NOT EXISTS pgcrypto;