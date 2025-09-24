-- Drop existing tables that might conflict
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.day_use_ticket_settings CASCADE;

-- Create updated profiles table structure for SpotIN
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update existing profiles to have barcodes if they don't
UPDATE public.profiles 
SET barcode = generate_barcode() 
WHERE barcode IS NULL;

-- Create admin users table for admin authentication
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users (only admins can access)
CREATE POLICY "Only admins can manage admin users" 
ON public.admin_users 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- Insert default admin user (password: admin123 - should be changed)
INSERT INTO public.admin_users (email, password_hash) 
VALUES ('admin@spotin.com', '$2b$10$rQx8.9xB8xvkZxK5yT.qvOGJt9G8XqA7M.Lp2E6VtYnCcKzW5sVJa')
ON CONFLICT (email) DO NOTHING;

-- Update trigger for admin_users
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();