-- Create cashier sessions table
CREATE TABLE IF NOT EXISTS public.cashier_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  staff_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  opening_cash NUMERIC NOT NULL DEFAULT 0,
  closing_cash NUMERIC,
  expected_cash NUMERIC,
  cash_difference NUMERIC,
  total_sales NUMERIC DEFAULT 0,
  cash_sales NUMERIC DEFAULT 0,
  card_sales NUMERIC DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cashier_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can view all cashier sessions"
  ON public.cashier_sessions
  FOR SELECT
  USING (is_admin_or_staff());

CREATE POLICY "Staff can create cashier sessions"
  ON public.cashier_sessions
  FOR INSERT
  WITH CHECK (is_admin_or_staff());

CREATE POLICY "Staff can update their own sessions"
  ON public.cashier_sessions
  FOR UPDATE
  USING (is_admin_or_staff());

-- Create index for faster queries
CREATE INDEX idx_cashier_sessions_staff_id ON public.cashier_sessions(staff_id);
CREATE INDEX idx_cashier_sessions_active ON public.cashier_sessions(is_active);
CREATE INDEX idx_cashier_sessions_start_time ON public.cashier_sessions(start_time DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_cashier_sessions_updated_at
  BEFORE UPDATE ON public.cashier_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();