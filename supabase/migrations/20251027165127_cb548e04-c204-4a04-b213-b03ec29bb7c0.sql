-- Add last_table_number column to clients table to remember their preferred table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS last_table_number TEXT;