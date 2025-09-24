-- First, let's check what duplicates exist and clean them up
-- Remove duplicate clients (keep the latest one)
DELETE FROM public.clients 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM public.clients 
    ORDER BY email, created_at DESC
);

-- Also clean up duplicates by phone
DELETE FROM public.clients 
WHERE id NOT IN (
    SELECT DISTINCT ON (phone) id 
    FROM public.clients 
    ORDER BY phone, created_at DESC
);

-- Now add the unique constraints
ALTER TABLE public.clients 
ADD CONSTRAINT clients_phone_unique UNIQUE (phone);

ALTER TABLE public.clients 
ADD CONSTRAINT clients_email_unique UNIQUE (email);

ALTER TABLE public.clients 
ADD CONSTRAINT clients_barcode_unique UNIQUE (barcode);

ALTER TABLE public.clients 
ADD CONSTRAINT clients_client_code_unique UNIQUE (client_code);