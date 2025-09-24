-- Create clients table
CREATE TABLE public.clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    barcode TEXT UNIQUE,
    has_membership BOOLEAN DEFAULT false,
    membership_type TEXT,
    membership_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sessions table for tracking check-ins/check-outs
CREATE TABLE public.sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    seat_number TEXT,
    room_number TEXT,
    session_type TEXT NOT NULL, -- 'Hot Desk', 'Private Desk', 'Conference', etc.
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create day use ticket settings table
CREATE TABLE public.day_use_ticket_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create receipts table
CREATE TABLE public.receipts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    items JSONB NOT NULL DEFAULT '[]', -- Array of receipt items
    day_use_ticket_added BOOLEAN DEFAULT false,
    day_use_ticket_price DECIMAL(10,2) DEFAULT 0.00,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_use_ticket_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on day_use_ticket_settings" ON public.day_use_ticket_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on receipts" ON public.receipts FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_day_use_ticket_settings_updated_at
    BEFORE UPDATE ON public.day_use_ticket_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default day use ticket setting
INSERT INTO public.day_use_ticket_settings (name, price, description, is_active)
VALUES ('Standard Day Use Ticket', 25.00, 'Complimentary day use ticket for members', true);

-- Insert sample clients for testing
INSERT INTO public.clients (name, email, phone, barcode, has_membership, membership_type, membership_expires_at)
VALUES 
('John Smith', 'john.smith@email.com', '+1234567890', 'BC001', true, 'Premium', '2024-12-31 23:59:59+00'),
('Sarah Johnson', 'sarah.johnson@email.com', '+1234567891', 'BC002', true, 'Standard', '2024-11-30 23:59:59+00'),
('Tech Corp', 'contact@techcorp.com', '+1234567892', 'BC003', false, null, null);