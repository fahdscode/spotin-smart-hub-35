-- Insert a fake client with membership
INSERT INTO public.clients (
  first_name,
  last_name, 
  full_name,
  phone,
  email,
  password_hash,
  client_code,
  barcode,
  job_title,
  how_did_you_find_us,
  active,
  is_active
) VALUES (
  'Sara',
  'Mohamed',
  'Sara Mohamed',
  '+20555666777',
  'sara.mohamed@test.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  'C-2025-000010',
  'SM2025',
  'Product Manager',
  'Facebook',
  true, -- checked in
  true  -- active account
);

-- Get the client ID for the membership assignment
DO $$
DECLARE
    client_uuid uuid;
BEGIN
    -- Get the client ID
    SELECT id INTO client_uuid 
    FROM public.clients 
    WHERE client_code = 'C-2025-000010';
    
    -- Insert membership for this client
    INSERT INTO public.client_memberships (
        client_id,
        plan_name,
        discount_percentage,
        perks,
        start_date,
        end_date,
        is_active,
        total_savings
    ) VALUES (
        client_uuid,
        'Premium',
        15,
        ARRAY['Free Coffee on Fridays', 'Priority Room Booking', '15% Discount on All Orders', 'Free Event Access'],
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '12 months',
        true,
        0
    );
    
    -- Log the check-in action
    INSERT INTO public.check_in_logs (
        client_id,
        action,
        scanned_barcode,
        scanned_by_user_id,
        notes,
        timestamp
    ) VALUES (
        client_uuid,
        'check_in',
        'SM2025',
        NULL,
        'Test client with Premium membership checked in',
        NOW() - INTERVAL '2 hours'
    );
END $$;