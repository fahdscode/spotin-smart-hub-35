-- Add national_id column to payroll table
ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS national_id TEXT;

-- Create function to generate employee ID
CREATE OR REPLACE FUNCTION public.generate_employee_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    new_id TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM now())::TEXT;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
        CASE 
            WHEN employee_id ~ ('^EMP-' || year_part || '-[0-9]+$') 
            THEN CAST(SUBSTRING(employee_id FROM '^EMP-' || year_part || '-([0-9]+)$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO sequence_num
    FROM public.payroll;
    
    new_id := 'EMP-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN new_id;
END;
$$;

-- Create trigger to auto-generate employee_id on insert
CREATE OR REPLACE FUNCTION public.set_employee_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.employee_id IS NULL OR NEW.employee_id = '' THEN
        NEW.employee_id := generate_employee_id();
    END IF;
    RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_set_employee_id ON public.payroll;
CREATE TRIGGER trigger_set_employee_id
    BEFORE INSERT ON public.payroll
    FOR EACH ROW
    EXECUTE FUNCTION public.set_employee_id();