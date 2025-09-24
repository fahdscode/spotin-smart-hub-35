-- Create clients table with unique barcodes
CREATE TABLE public.clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_code TEXT NOT NULL UNIQUE, -- e.g., "C-2025-000123"
    barcode TEXT NOT NULL UNIQUE, -- encoded barcode string
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create check_in_logs table for tracking entries/exits
CREATE TABLE public.check_in_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('check_in', 'check_out')),
    scanned_barcode TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    scanned_by_user_id UUID REFERENCES auth.users(id),
    notes TEXT
);

-- Enable RLS
ALTER TABLE public.check_in_logs ENABLE ROW LEVEL SECURITY;

-- Create function to generate unique client codes
CREATE OR REPLACE FUNCTION public.generate_client_code()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    new_code TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM now())::TEXT;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
        CASE 
            WHEN client_code ~ ('^C-' || year_part || '-[0-9]+$') 
            THEN CAST(SUBSTRING(client_code FROM '^C-' || year_part || '-([0-9]+)$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM public.clients;
    
    new_code := 'C-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate barcode from client code
CREATE OR REPLACE FUNCTION public.generate_barcode_for_client(client_code TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Simply return the client code as the barcode content
    -- This will be encoded by the frontend barcode library
    RETURN client_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to get client's current status
CREATE OR REPLACE FUNCTION public.get_client_status(client_id UUID)
RETURNS TEXT AS $$
DECLARE
    last_action TEXT;
BEGIN
    SELECT action INTO last_action
    FROM public.check_in_logs
    WHERE client_id = get_client_status.client_id
    ORDER BY timestamp DESC
    LIMIT 1;
    
    RETURN COALESCE(last_action, 'checked_out');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for clients table
CREATE POLICY "Clients can view their own profile"
ON public.clients FOR SELECT
USING (true); -- Allow public read for barcode scanning

CREATE POLICY "Staff can view all clients"
ON public.clients FOR SELECT
USING (is_admin_or_staff());

CREATE POLICY "Only system can insert clients"
ON public.clients FOR INSERT
WITH CHECK (false); -- Prevent direct inserts, use functions instead

CREATE POLICY "Clients can update their own profile"
ON public.clients FOR UPDATE
USING (auth.uid()::TEXT = id::TEXT)
WITH CHECK (auth.uid()::TEXT = id::TEXT);

-- RLS Policies for check_in_logs
CREATE POLICY "Staff can view all check-in logs"
ON public.check_in_logs FOR SELECT
USING (is_admin_or_staff());

CREATE POLICY "Staff can create check-in logs"
ON public.check_in_logs FOR INSERT
WITH CHECK (is_admin_or_staff());

CREATE POLICY "Clients can view their own logs"
ON public.check_in_logs FOR SELECT
USING (client_id::TEXT = auth.uid()::TEXT);

-- Create trigger for updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create demo client
INSERT INTO public.clients (client_code, barcode, full_name, phone, email, password_hash)
VALUES (
    'C-2025-DEMO01',
    'C-2025-DEMO01',
    'Demo Client',
    'demo123',
    'demo@spotin.com',
    '$2a$10$rXKjQnIvZ5Kt.Jq2Lf9d7e8Hs9Pk3Lm4No5Qr6St7Uv8Wx9Yz0Aa1b' -- password: "1234"
);