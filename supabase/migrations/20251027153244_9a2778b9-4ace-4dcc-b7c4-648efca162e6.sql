-- Fix receipts table foreign key to reference clients table instead of auth.users
-- This allows receipts to be created for clients during checkout

-- Drop the existing foreign key constraint if it exists
ALTER TABLE public.receipts
DROP CONSTRAINT IF EXISTS receipts_user_id_fkey;

-- Add new foreign key constraint referencing the clients table
ALTER TABLE public.receipts
ADD CONSTRAINT receipts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.clients(id) 
ON DELETE CASCADE;