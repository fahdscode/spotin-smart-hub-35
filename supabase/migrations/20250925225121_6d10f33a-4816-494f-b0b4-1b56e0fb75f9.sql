-- Create membership_plans table to store available membership plans
CREATE TABLE public.membership_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name text NOT NULL UNIQUE,
  discount_percentage integer NOT NULL DEFAULT 0,
  perks text[] DEFAULT '{}',
  price numeric NOT NULL DEFAULT 0,
  duration_months integer NOT NULL DEFAULT 1,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on membership_plans
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for membership_plans
CREATE POLICY "Staff can view all membership plans" 
ON public.membership_plans 
FOR SELECT 
USING (is_admin_or_staff());

CREATE POLICY "Operations staff can manage membership plans" 
ON public.membership_plans 
FOR ALL 
USING (is_admin_or_staff());

-- Add trigger for updated_at
CREATE TRIGGER update_membership_plans_updated_at
BEFORE UPDATE ON public.membership_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default membership plans
INSERT INTO public.membership_plans (plan_name, discount_percentage, perks, price, duration_months, description) VALUES
('Basic', 10, '{"Free WiFi", "Community Events"}', 99.00, 1, 'Basic membership with essential perks'),
('Premium', 20, '{"Free WiFi", "Community Events", "Meeting Room Discounts", "Free Coffee"}', 199.00, 1, 'Premium membership with enhanced benefits'),
('VIP', 30, '{"Free WiFi", "Community Events", "Free Meeting Rooms", "Free Coffee", "Priority Support", "Exclusive Events"}', 299.00, 1, 'VIP membership with all premium benefits');