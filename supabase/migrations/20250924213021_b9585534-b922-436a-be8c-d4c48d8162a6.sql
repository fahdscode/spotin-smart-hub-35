-- Add active status field to clients table for real-time check-in tracking
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT false;

-- Create index on barcode for fast lookups
CREATE INDEX IF NOT EXISTS idx_clients_barcode ON public.clients(barcode);