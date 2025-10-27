-- Enable Row Level Security on publicly exposed tables
-- This is critical to prevent unauthorized access to sensitive data

-- Enable RLS on admin_users (5 staff records exposed)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on clients (customer data exposed)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on receipts (transaction data exposed)
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
DO $$
DECLARE
  admin_users_rls boolean;
  clients_rls boolean;
  receipts_rls boolean;
BEGIN
  SELECT relrowsecurity INTO admin_users_rls FROM pg_class WHERE relname = 'admin_users';
  SELECT relrowsecurity INTO clients_rls FROM pg_class WHERE relname = 'clients';
  SELECT relrowsecurity INTO receipts_rls FROM pg_class WHERE relname = 'receipts';
  
  IF NOT admin_users_rls THEN
    RAISE EXCEPTION 'RLS not enabled on admin_users table';
  END IF;
  
  IF NOT clients_rls THEN
    RAISE EXCEPTION 'RLS not enabled on clients table';
  END IF;
  
  IF NOT receipts_rls THEN
    RAISE EXCEPTION 'RLS not enabled on receipts table';
  END IF;
  
  RAISE NOTICE 'RLS successfully enabled on all tables';
END $$;