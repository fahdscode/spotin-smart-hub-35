-- Create RPC function for clients to register for events
CREATE OR REPLACE FUNCTION register_client_for_event(
  p_client_id UUID,
  p_event_id UUID,
  p_attendee_name TEXT,
  p_attendee_email TEXT,
  p_attendee_phone TEXT,
  p_special_requests TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_event RECORD;
  v_existing_registration UUID;
  v_registration_id UUID;
BEGIN
  -- Check if event exists and is active
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Event not found or is not active'
    );
  END IF;
  
  -- Check if event is full
  IF v_event.registered_attendees >= v_event.capacity THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Event is full'
    );
  END IF;
  
  -- Check if client is already registered
  SELECT id INTO v_existing_registration
  FROM event_registrations
  WHERE client_id = p_client_id AND event_id = p_event_id;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You are already registered for this event'
    );
  END IF;
  
  -- Create registration
  INSERT INTO event_registrations (
    client_id,
    event_id,
    attendee_name,
    attendee_email,
    attendee_phone,
    special_requests,
    attendance_status
  )
  VALUES (
    p_client_id,
    p_event_id,
    p_attendee_name,
    p_attendee_email,
    p_attendee_phone,
    p_special_requests,
    'registered'
  )
  RETURNING id INTO v_registration_id;
  
  -- Update event registered count
  UPDATE events
  SET registered_attendees = registered_attendees + 1
  WHERE id = p_event_id;
  
  RETURN json_build_object(
    'success', true,
    'registration_id', v_registration_id,
    'message', 'Successfully registered for event'
  );
END;
$$;

-- Create RPC function to get client's event registrations
CREATE OR REPLACE FUNCTION get_client_event_registrations(p_client_id UUID)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  event_title TEXT,
  event_title_ar TEXT,
  event_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  price NUMERIC,
  attendance_status TEXT,
  registration_date TIMESTAMPTZ,
  special_requests TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.id,
    er.event_id,
    e.title as event_title,
    e.title_ar as event_title_ar,
    e.event_date,
    e.start_time,
    e.end_time,
    e.location,
    e.price,
    er.attendance_status,
    er.registration_date,
    er.special_requests
  FROM event_registrations er
  INNER JOIN events e ON e.id = er.event_id
  WHERE er.client_id = p_client_id
  ORDER BY e.event_date DESC, e.start_time DESC;
END;
$$;