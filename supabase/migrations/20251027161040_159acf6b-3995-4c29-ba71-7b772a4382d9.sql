-- Add columns to track additional payment methods in cashier sessions
ALTER TABLE public.cashier_sessions
ADD COLUMN IF NOT EXISTS bank_transfer_sales numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS hot_desk_sales numeric DEFAULT 0;

-- Add comment to document the payment method columns
COMMENT ON COLUMN public.cashier_sessions.cash_sales IS 'Total sales paid in cash';
COMMENT ON COLUMN public.cashier_sessions.card_sales IS 'Total sales paid by card (Visa)';
COMMENT ON COLUMN public.cashier_sessions.bank_transfer_sales IS 'Total sales paid by bank transfer';
COMMENT ON COLUMN public.cashier_sessions.hot_desk_sales IS 'Total sales paid via hot desk';

-- Update the total_sales calculation to include all payment methods
-- This is just documentation - the application should calculate this
COMMENT ON COLUMN public.cashier_sessions.total_sales IS 'Total sales across all payment methods (cash + card + bank_transfer + hot_desk)';