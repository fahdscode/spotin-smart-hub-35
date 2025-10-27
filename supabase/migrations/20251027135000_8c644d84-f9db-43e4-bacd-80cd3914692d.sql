-- Add cancellation tracking to receipts table
ALTER TABLE public.receipts 
ADD COLUMN status text NOT NULL DEFAULT 'completed',
ADD COLUMN cancellation_reason text,
ADD COLUMN cancelled_at timestamp with time zone,
ADD COLUMN cancelled_by uuid REFERENCES auth.users(id);

-- Add check constraint for status
ALTER TABLE public.receipts 
ADD CONSTRAINT receipts_status_check 
CHECK (status IN ('completed', 'cancelled'));

-- Create index for faster filtering
CREATE INDEX idx_receipts_status ON public.receipts(status);
CREATE INDEX idx_receipts_cancelled_at ON public.receipts(cancelled_at) WHERE cancelled_at IS NOT NULL;