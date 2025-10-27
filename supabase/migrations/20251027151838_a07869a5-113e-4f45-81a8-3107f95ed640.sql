-- Finance Portal: Enhanced tables for comprehensive financial tracking

-- Create expense categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT 'bg-blue-500',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budgets table for budget vs actual tracking
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  budget_type TEXT NOT NULL CHECK (budget_type IN ('income', 'expense')),
  month_year DATE NOT NULL, -- First day of the month
  planned_amount NUMERIC NOT NULL DEFAULT 0,
  actual_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, budget_type, month_year)
);

-- Create financial transactions table for comprehensive tracking
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'asset', 'liability')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  reference_number TEXT,
  payment_method TEXT DEFAULT 'cash',
  vendor_id UUID REFERENCES public.vendors(id),
  created_by UUID,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
CREATE POLICY "Staff can view expense categories"
  ON public.expense_categories FOR SELECT
  USING (is_admin_or_staff());

CREATE POLICY "Staff can manage expense categories"
  ON public.expense_categories FOR ALL
  USING (is_admin_or_staff());

-- RLS Policies for budgets
CREATE POLICY "Staff can view budgets"
  ON public.budgets FOR SELECT
  USING (is_admin_or_staff());

CREATE POLICY "Staff can manage budgets"
  ON public.budgets FOR ALL
  USING (is_admin_or_staff());

-- RLS Policies for financial_transactions
CREATE POLICY "Staff can view financial transactions"
  ON public.financial_transactions FOR SELECT
  USING (is_admin_or_staff());

CREATE POLICY "Staff can manage financial transactions"
  ON public.financial_transactions FOR ALL
  USING (is_admin_or_staff());

-- Insert default expense categories
INSERT INTO public.expense_categories (name, description, color) VALUES
  ('Rent & Utilities', 'Office rent, electricity, water, internet', 'bg-purple-500'),
  ('Salaries & Wages', 'Staff salaries and payroll', 'bg-blue-500'),
  ('Inventory & Supplies', 'Stock purchases, supplies, equipment', 'bg-green-500'),
  ('Marketing & Advertising', 'Promotions, ads, marketing campaigns', 'bg-orange-500'),
  ('Maintenance & Repairs', 'Equipment repairs, facility maintenance', 'bg-red-500'),
  ('Insurance', 'Business insurance premiums', 'bg-indigo-500'),
  ('Professional Services', 'Legal, accounting, consulting fees', 'bg-pink-500'),
  ('Technology & Software', 'Software subscriptions, IT services', 'bg-cyan-500'),
  ('Transportation', 'Delivery, fuel, vehicle maintenance', 'bg-yellow-500'),
  ('Miscellaneous', 'Other operational expenses', 'bg-gray-500')
ON CONFLICT (name) DO NOTHING;

-- Add category column to bills table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE public.bills ADD COLUMN category TEXT DEFAULT 'Miscellaneous';
  END IF;
END $$;

-- Add updated_at trigger for new tables
CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();