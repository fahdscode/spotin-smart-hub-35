-- Clean up demo and test data from clients table
DELETE FROM public.clients WHERE email LIKE '%demo%' OR email LIKE '%test%';

-- Also clean up any demo data from other tables
DELETE FROM public.check_in_logs WHERE notes LIKE '%demo%' OR notes LIKE '%test%';
DELETE FROM public.system_logs WHERE message LIKE '%demo%' OR message LIKE '%test%';