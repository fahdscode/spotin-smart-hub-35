-- Add table_number and notes columns to session_line_items table for client orders
ALTER TABLE public.session_line_items 
ADD COLUMN IF NOT EXISTS table_number text,
ADD COLUMN IF NOT EXISTS notes text;

-- Add index for faster table number lookups
CREATE INDEX IF NOT EXISTS idx_session_line_items_table_number 
ON public.session_line_items(table_number) 
WHERE table_number IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.session_line_items.table_number IS 'Table number where the client is seated';
COMMENT ON COLUMN public.session_line_items.notes IS 'Special instructions or notes for the order item';