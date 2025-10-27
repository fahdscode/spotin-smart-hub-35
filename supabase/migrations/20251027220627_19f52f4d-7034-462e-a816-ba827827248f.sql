-- Create payroll table for employee salary information
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  employee_id TEXT,
  position TEXT NOT NULL,
  department TEXT,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  bonuses NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_salary NUMERIC GENERATED ALWAYS AS (base_salary + COALESCE(bonuses, 0) - COALESCE(deductions, 0)) STORED,
  payment_frequency TEXT NOT NULL DEFAULT 'monthly',
  bank_account TEXT,
  tax_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payroll transactions table
CREATE TABLE IF NOT EXISTS public.payroll_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_id UUID NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_amount NUMERIC NOT NULL,
  bonuses NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'bank_transfer',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll
CREATE POLICY "Finance staff can manage payroll"
ON public.payroll
FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Finance staff can view payroll"
ON public.payroll
FOR SELECT
USING (is_admin_or_staff());

-- RLS Policies for payroll_transactions
CREATE POLICY "Finance staff can manage payroll transactions"
ON public.payroll_transactions
FOR ALL
USING (is_admin_or_staff());

CREATE POLICY "Finance staff can view payroll transactions"
ON public.payroll_transactions
FOR SELECT
USING (is_admin_or_staff());

-- Trigger to update updated_at
CREATE TRIGGER update_payroll_updated_at
BEFORE UPDATE ON public.payroll
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_transactions_updated_at
BEFORE UPDATE ON public.payroll_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();