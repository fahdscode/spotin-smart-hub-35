-- Add Arabic language columns to drinks (products) table
ALTER TABLE drinks 
ADD COLUMN IF NOT EXISTS name_ar TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Add Arabic language columns to client_tickets table (via tickets reference)
-- First, let's check if we need a tickets/ticket_types table
-- For now, we'll add Arabic fields to any ticket-related data

-- Add Arabic language columns to membership_plans table
ALTER TABLE membership_plans
ADD COLUMN IF NOT EXISTS plan_name_ar TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Update existing records with placeholder Arabic text (you can update these later)
UPDATE drinks 
SET name_ar = name || ' (عربي)',
    description_ar = description
WHERE name_ar IS NULL;

UPDATE membership_plans
SET plan_name_ar = plan_name || ' (عربي)',
    description_ar = description  
WHERE plan_name_ar IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN drinks.name_ar IS 'Arabic translation of product name';
COMMENT ON COLUMN drinks.description_ar IS 'Arabic translation of product description';
COMMENT ON COLUMN membership_plans.plan_name_ar IS 'Arabic translation of membership plan name';
COMMENT ON COLUMN membership_plans.description_ar IS 'Arabic translation of membership plan description';