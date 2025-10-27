-- Add ticket_type column to drinks table for better categorization
ALTER TABLE public.drinks
ADD COLUMN IF NOT EXISTS ticket_type text DEFAULT 'day_use';

-- Add a comment for clarity
COMMENT ON COLUMN public.drinks.ticket_type IS 'Type of ticket: day_use, event, drink_included, premium, etc.';