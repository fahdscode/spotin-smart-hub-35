-- Create drinks table
CREATE TABLE public.drinks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    price numeric NOT NULL,
    category text NOT NULL DEFAULT 'beverage',
    description text,
    image_url text,
    is_available boolean NOT NULL DEFAULT true,
    ingredients text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    event_date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    price numeric NOT NULL DEFAULT 0,
    capacity integer NOT NULL DEFAULT 50,
    registered_attendees integer NOT NULL DEFAULT 0,
    category text NOT NULL DEFAULT 'workshop',
    location text,
    image_url text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create traffic_data table for real-time occupancy
CREATE TABLE public.traffic_data (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp timestamp with time zone NOT NULL DEFAULT now(),
    current_occupancy integer NOT NULL DEFAULT 0,
    max_capacity integer NOT NULL DEFAULT 100,
    area text NOT NULL DEFAULT 'main_floor',
    peak_hours jsonb DEFAULT '{"morning": 25, "afternoon": 45, "evening": 30}'::jsonb
);

-- Add client_id to check_ins table to properly link with clients
ALTER TABLE public.check_ins ADD COLUMN client_id uuid REFERENCES public.clients(id);

-- Enable RLS on new tables
ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for drinks (publicly viewable)
CREATE POLICY "Drinks are viewable by everyone" 
ON public.drinks 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage drinks" 
ON public.drinks 
FOR ALL 
USING (is_admin_or_staff());

-- Create RLS policies for events (publicly viewable)
CREATE POLICY "Events are viewable by everyone" 
ON public.events 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Staff can manage events" 
ON public.events 
FOR ALL 
USING (is_admin_or_staff());

-- Create RLS policies for traffic data (publicly viewable)
CREATE POLICY "Traffic data is viewable by everyone" 
ON public.traffic_data 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage traffic data" 
ON public.traffic_data 
FOR ALL 
USING (is_admin_or_staff());

-- Insert sample drinks data
INSERT INTO public.drinks (name, price, category, description, is_available) VALUES
('Espresso', 3.50, 'coffee', 'Rich and bold espresso shot', true),
('Cappuccino', 4.50, 'coffee', 'Espresso with steamed milk and foam', true),
('Latte', 5.00, 'coffee', 'Espresso with steamed milk', true),
('Americano', 4.00, 'coffee', 'Espresso with hot water', true),
('Mocha', 5.50, 'coffee', 'Espresso with chocolate and steamed milk', true),
('Green Tea', 3.00, 'tea', 'Fresh green tea', true),
('Earl Grey', 3.00, 'tea', 'Classic black tea with bergamot', true),
('Fresh Orange Juice', 4.00, 'juice', 'Freshly squeezed orange juice', true),
('Sparkling Water', 2.50, 'water', 'Refreshing sparkling water', true),
('Energy Drink', 3.50, 'energy', 'Natural energy boost drink', true);

-- Insert sample events data
INSERT INTO public.events (title, description, event_date, start_time, end_time, price, capacity, category, location) VALUES
('Networking Mixer', 'Monthly networking event for professionals', CURRENT_DATE + INTERVAL '3 days', '18:00', '20:00', 0, 50, 'networking', 'Main Hall'),
('Startup Pitch Night', 'Entrepreneurs pitch their startup ideas', CURRENT_DATE + INTERVAL '7 days', '19:00', '21:00', 15, 30, 'startup', 'Conference Room A'),
('Digital Marketing Workshop', 'Learn the latest digital marketing strategies', CURRENT_DATE + INTERVAL '10 days', '14:00', '17:00', 25, 25, 'workshop', 'Training Room'),
('Coffee Cupping Session', 'Taste and learn about different coffee varieties', CURRENT_DATE + INTERVAL '14 days', '10:00', '12:00', 20, 15, 'workshop', 'Cafe Area'),
('Freelancer Meet & Greet', 'Connect with other freelancers and remote workers', CURRENT_DATE + INTERVAL '17 days', '17:00', '19:00', 0, 40, 'networking', 'Lounge Area');

-- Insert current traffic data
INSERT INTO public.traffic_data (current_occupancy, max_capacity, area) VALUES
(35, 100, 'main_floor'),
(12, 25, 'quiet_zone'),
(8, 15, 'meeting_rooms');

-- Add trigger for updated_at on new tables
CREATE TRIGGER update_drinks_updated_at
    BEFORE UPDATE ON public.drinks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get client check-in status
CREATE OR REPLACE FUNCTION public.get_client_check_in_status(p_client_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    last_checkin record;
BEGIN
    SELECT status, checked_out_at
    INTO last_checkin
    FROM public.check_ins
    WHERE client_id = p_client_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF last_checkin.status IS NULL THEN
        RETURN 'checked_out';
    ELSIF last_checkin.status = 'checked_in' AND last_checkin.checked_out_at IS NULL THEN
        RETURN 'checked_in';
    ELSE
        RETURN 'checked_out';
    END IF;
END;
$function$;