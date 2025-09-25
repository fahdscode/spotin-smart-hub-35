-- Add some test clients without the problematic check-ins for now
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
) VALUES 
(
    'John', 
    'Smith', 
    'John Smith', 
    '+1234567890', 
    'john.smith@example.com', 
    '$2b$10$example_hash_1', 
    'C-2024-000001', 
    'ABC123', 
    'Software Engineer', 
    'Google search', 
    true,
    true
),
(
    'Sarah', 
    'Johnson', 
    'Sarah Johnson', 
    '+1234567891', 
    'sarah.johnson@example.com', 
    '$2b$10$example_hash_2', 
    'C-2024-000002', 
    'DEF456', 
    'Marketing Manager', 
    'Friend referral', 
    false,
    true
),
(
    'Mike', 
    'Wilson', 
    'Mike Wilson', 
    '+1234567892', 
    'mike.wilson@example.com', 
    '$2b$10$example_hash_3', 
    'C-2024-000003', 
    'GHI789', 
    'Product Manager', 
    'LinkedIn', 
    true,
    true
)
ON CONFLICT (barcode) DO NOTHING;