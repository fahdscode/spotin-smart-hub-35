-- Enable RLS on tables that have policies but RLS disabled
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;