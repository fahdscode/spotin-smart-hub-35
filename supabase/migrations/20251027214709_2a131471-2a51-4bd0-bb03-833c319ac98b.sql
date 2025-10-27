-- Add includes_free_pass column to membership_plans table
ALTER TABLE public.membership_plans 
ADD COLUMN IF NOT EXISTS includes_free_pass BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.membership_plans.includes_free_pass IS 'Whether the membership plan includes a free pass or only provides discounts';