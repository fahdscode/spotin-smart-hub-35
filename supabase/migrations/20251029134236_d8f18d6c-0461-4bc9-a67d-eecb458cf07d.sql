-- Drop and recreate the function with correct return type
DROP FUNCTION IF EXISTS get_client_check_in_status(UUID);

-- Create RPC function to get client check-in status
-- This allows clients to fetch their own status without Supabase auth
CREATE OR REPLACE FUNCTION get_client_check_in_status(p_client_id UUID)
RETURNS TABLE (
  active BOOLEAN,
  updated_at TIMESTAMPTZ,
  check_in_time TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.active,
    c.updated_at,
    ci.checked_in_at as check_in_time
  FROM clients c
  LEFT JOIN check_ins ci ON ci.client_id = c.id 
    AND ci.status = 'checked_in' 
    AND ci.checked_out_at IS NULL
  WHERE c.id = p_client_id
  ORDER BY ci.checked_in_at DESC
  LIMIT 1;
END;
$$;