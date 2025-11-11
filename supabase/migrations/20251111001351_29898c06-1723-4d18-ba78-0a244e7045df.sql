-- Add cancellation tracking fields to session_line_items
ALTER TABLE public.session_line_items 
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;