-- Allow NULL client_id in check_in_logs for failed barcode lookups
ALTER TABLE public.check_in_logs ALTER COLUMN client_id DROP NOT NULL;