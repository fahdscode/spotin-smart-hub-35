-- Add email verification column to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_barcode ON public.clients(barcode);

-- Add rate limiting table for login attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  ip_address inet,
  attempted_at timestamp with time zone DEFAULT now(),
  success boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy to allow staff to view login attempts
CREATE POLICY "Staff can view login attempts" ON public.login_attempts
FOR SELECT USING (is_admin_or_staff());

-- Policy to allow anyone to insert login attempts (for tracking)
CREATE POLICY "Anyone can log login attempts" ON public.login_attempts
FOR INSERT WITH CHECK (true);

-- Function to check rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_phone text, p_ip_address inet DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_attempts integer;
BEGIN
  -- Count failed attempts in last 15 minutes
  SELECT COUNT(*) INTO recent_attempts
  FROM public.login_attempts
  WHERE phone = p_phone
  AND attempted_at > now() - INTERVAL '15 minutes'
  AND success = false;
  
  -- Allow if less than 5 failed attempts
  RETURN recent_attempts < 5;
END;
$$;

-- Function to log login attempts
CREATE OR REPLACE FUNCTION public.log_login_attempt(p_phone text, p_success boolean, p_ip_address inet DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (phone, ip_address, success)
  VALUES (p_phone, p_ip_address, p_success);
END;
$$;

-- Updated authenticate_client function with rate limiting
CREATE OR REPLACE FUNCTION public.authenticate_client_secure(client_phone text, client_password text, p_ip_address inet DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    client_record record;
    rate_limit_ok boolean;
BEGIN
    -- Check rate limiting first
    SELECT check_rate_limit(client_phone, p_ip_address) INTO rate_limit_ok;
    
    IF NOT rate_limit_ok THEN
        -- Log failed attempt
        PERFORM log_login_attempt(client_phone, false, p_ip_address);
        
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Too many failed attempts. Please try again in 15 minutes.'
        );
    END IF;
    
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
    WHERE (phone = client_phone OR phone = '+' || client_phone OR REPLACE(phone, '+', '') = client_phone)
    AND is_active = true;
    
    -- Check if client exists
    IF client_record.id IS NOT NULL THEN
        -- Log successful attempt
        PERFORM log_login_attempt(client_phone, true, p_ip_address);
        
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
        -- Log failed attempt
        PERFORM log_login_attempt(client_phone, false, p_ip_address);
        
        -- Return failure for non-existent client
        RETURN jsonb_build_object('success', false, 'error', 'Invalid phone number or password');
    END IF;
END;
$$;

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on password reset tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Policy for password reset tokens
CREATE POLICY "Clients can view their own reset tokens" ON public.password_reset_tokens
FOR SELECT USING (client_id = (SELECT id FROM public.clients WHERE phone = CURRENT_SETTING('app.current_phone', true)));

-- Function to generate password reset token
CREATE OR REPLACE FUNCTION public.generate_reset_token(p_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    client_record record;
    reset_token text;
    token_id uuid;
BEGIN
    -- Find client by phone
    SELECT id, full_name, email INTO client_record
    FROM public.clients
    WHERE phone = p_phone AND is_active = true;
    
    IF client_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Phone number not found');
    END IF;
    
    -- Generate random 6-digit token
    reset_token := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    
    -- Invalidate any existing tokens for this client
    UPDATE public.password_reset_tokens 
    SET used = true 
    WHERE client_id = client_record.id AND used = false;
    
    -- Create new reset token (expires in 15 minutes)
    INSERT INTO public.password_reset_tokens (client_id, token, expires_at)
    VALUES (client_record.id, reset_token, now() + INTERVAL '15 minutes')
    RETURNING id INTO token_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'token', reset_token,
        'client_name', client_record.full_name,
        'client_email', client_record.email,
        'expires_in_minutes', 15
    );
END;
$$;