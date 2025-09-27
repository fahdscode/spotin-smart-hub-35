-- Remove the problematic constraint completely
ALTER TABLE public.check_in_logs 
DROP CONSTRAINT IF EXISTS check_in_logs_action_check;

-- Update existing data to use consistent action names
UPDATE public.check_in_logs 
SET action = 'checked_in' 
WHERE action = 'check_in';

UPDATE public.check_in_logs 
SET action = 'checked_out' 
WHERE action = 'check_out';