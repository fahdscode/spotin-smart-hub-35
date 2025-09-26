-- Create event registrations table to track attendees
CREATE TABLE public.event_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  attendee_name text NOT NULL,
  attendee_email text NOT NULL,
  attendee_phone text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  registration_date timestamp with time zone NOT NULL DEFAULT now(),
  special_requests text,
  attendance_status text NOT NULL DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'no_show', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can manage event registrations" 
ON public.event_registrations 
FOR ALL 
USING (is_admin_or_staff());

CREATE POLICY "Staff can view all event registrations" 
ON public.event_registrations 
FOR SELECT 
USING (is_admin_or_staff());

-- Create indexes for better performance
CREATE INDEX idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_client_id ON public.event_registrations(client_id);
CREATE INDEX idx_event_registrations_email ON public.event_registrations(attendee_email);

-- Create function to update event attendee count
CREATE OR REPLACE FUNCTION public.update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increase attendee count when new registration
    UPDATE public.events 
    SET registered_attendees = registered_attendees + 1 
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease attendee count when registration deleted
    UPDATE public.events 
    SET registered_attendees = GREATEST(0, registered_attendees - 1) 
    WHERE id = OLD.event_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes that might affect count
    IF OLD.attendance_status != 'cancelled' AND NEW.attendance_status = 'cancelled' THEN
      UPDATE public.events 
      SET registered_attendees = GREATEST(0, registered_attendees - 1) 
      WHERE id = NEW.event_id;
    ELSIF OLD.attendance_status = 'cancelled' AND NEW.attendance_status != 'cancelled' THEN
      UPDATE public.events 
      SET registered_attendees = registered_attendees + 1 
      WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER update_event_attendee_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_event_attendee_count();

-- Create function to get event analytics
CREATE OR REPLACE FUNCTION public.get_event_analytics(p_start_date date DEFAULT NULL, p_end_date date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_events integer;
    total_registrations integer;
    total_revenue numeric;
    avg_attendance_rate numeric;
    popular_categories jsonb;
    monthly_stats jsonb;
    result jsonb;
BEGIN
    -- Set default date range if not provided
    IF p_start_date IS NULL THEN
        p_start_date := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')::date;
    END IF;
    IF p_end_date IS NULL THEN
        p_end_date := CURRENT_DATE;
    END IF;
    
    -- Total events in date range
    SELECT COUNT(*) INTO total_events
    FROM public.events
    WHERE event_date BETWEEN p_start_date AND p_end_date
    AND is_active = true;
    
    -- Total registrations
    SELECT COUNT(*) INTO total_registrations
    FROM public.event_registrations er
    JOIN public.events e ON er.event_id = e.id
    WHERE e.event_date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true;
    
    -- Total revenue
    SELECT COALESCE(SUM(e.price), 0) INTO total_revenue
    FROM public.event_registrations er
    JOIN public.events e ON er.event_id = e.id
    WHERE e.event_date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND er.attendance_status != 'cancelled';
    
    -- Average attendance rate
    SELECT COALESCE(AVG(
        CASE 
            WHEN e.capacity > 0 THEN (e.registered_attendees::numeric / e.capacity::numeric) * 100
            ELSE 0
        END
    ), 0) INTO avg_attendance_rate
    FROM public.events e
    WHERE e.event_date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true;
    
    -- Popular categories
    SELECT jsonb_agg(
        jsonb_build_object(
            'category', category,
            'count', event_count,
            'registrations', total_regs
        ) ORDER BY event_count DESC
    ) INTO popular_categories
    FROM (
        SELECT 
            e.category,
            COUNT(e.id) as event_count,
            COALESCE(SUM(e.registered_attendees), 0) as total_regs
        FROM public.events e
        WHERE e.event_date BETWEEN p_start_date AND p_end_date
        AND e.is_active = true
        GROUP BY e.category
        LIMIT 5
    ) cat_stats;
    
    -- Monthly statistics
    SELECT jsonb_agg(
        jsonb_build_object(
            'month', month_year,
            'events', event_count,
            'registrations', registration_count,
            'revenue', revenue
        ) ORDER BY month_year
    ) INTO monthly_stats
    FROM (
        SELECT 
            TO_CHAR(e.event_date, 'YYYY-MM') as month_year,
            COUNT(e.id) as event_count,
            COALESCE(SUM(e.registered_attendees), 0) as registration_count,
            COALESCE(SUM(e.price * e.registered_attendees), 0) as revenue
        FROM public.events e
        WHERE e.event_date BETWEEN p_start_date AND p_end_date
        AND e.is_active = true
        GROUP BY TO_CHAR(e.event_date, 'YYYY-MM')
        ORDER BY month_year
    ) monthly;
    
    -- Build result
    result := jsonb_build_object(
        'total_events', total_events,
        'total_registrations', total_registrations,
        'total_revenue', total_revenue,
        'avg_attendance_rate', ROUND(avg_attendance_rate, 1),
        'popular_categories', COALESCE(popular_categories, '[]'::jsonb),
        'monthly_stats', COALESCE(monthly_stats, '[]'::jsonb),
        'date_range', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        )
    );
    
    RETURN result;
END;
$$;