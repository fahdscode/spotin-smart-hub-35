-- Backfill historical check_ins records from existing client_tickets
-- This ensures all past ticket assignments are counted as visits in analytics

INSERT INTO public.check_ins (client_id, status, checked_in_at, created_at)
SELECT 
  client_id,
  'checked_in' as status,
  checked_in_at,
  checked_in_at as created_at
FROM public.client_tickets
WHERE checked_in_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.check_ins 
    WHERE check_ins.client_id = client_tickets.client_id 
    AND check_ins.checked_in_at = client_tickets.checked_in_at
  )
ORDER BY checked_in_at;