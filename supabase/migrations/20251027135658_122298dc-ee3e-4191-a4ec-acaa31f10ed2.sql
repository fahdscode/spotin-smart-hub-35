-- Add unique constraint to ensure only one active membership per client
-- This prevents data integrity issues where a client could have multiple active memberships

CREATE UNIQUE INDEX unique_active_membership_per_client 
ON public.client_memberships (client_id) 
WHERE is_active = true;

-- Add comment for documentation
COMMENT ON INDEX unique_active_membership_per_client IS 
'Ensures each client can have only one active membership at a time';