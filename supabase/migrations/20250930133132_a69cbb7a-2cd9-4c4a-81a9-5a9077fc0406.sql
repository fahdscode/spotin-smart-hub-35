-- Fix check_ins table to make user_id nullable
-- This allows clients to check in without a receptionist user_id
ALTER TABLE public.check_ins 
ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN public.check_ins.user_id IS 'References auth.users - only set when a receptionist performs the check-in';
COMMENT ON COLUMN public.check_ins.client_id IS 'The client being checked in - can be null for general users';