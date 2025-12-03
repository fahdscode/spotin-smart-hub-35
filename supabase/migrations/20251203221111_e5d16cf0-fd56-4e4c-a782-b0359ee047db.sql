
-- Function to get top point earners for a given month
CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard(
  p_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
  p_limit INTEGER DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'rank', row_num,
      'client_id', client_id,
      'client_name', client_name,
      'points_earned', points_earned,
      'transactions_count', transactions_count
    ) ORDER BY row_num
  )
  INTO result
  FROM (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY SUM(pt.points) DESC) as row_num,
      c.id as client_id,
      c.full_name as client_name,
      SUM(pt.points) as points_earned,
      COUNT(pt.id) as transactions_count
    FROM public.points_transactions pt
    JOIN public.clients c ON pt.client_id = c.id
    WHERE pt.transaction_type = 'earned'
    AND pt.created_at >= p_month
    AND pt.created_at < (p_month + INTERVAL '1 month')
    AND c.is_active = true
    GROUP BY c.id, c.full_name
    ORDER BY SUM(pt.points) DESC
    LIMIT p_limit
  ) ranked;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Function to get a client's rank for the current month
CREATE OR REPLACE FUNCTION public.get_client_monthly_rank(p_client_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  client_rank INTEGER;
  client_points INTEGER;
  total_participants INTEGER;
BEGIN
  -- Get client's points for this month
  SELECT COALESCE(SUM(points), 0)
  INTO client_points
  FROM public.points_transactions
  WHERE client_id = p_client_id
  AND transaction_type = 'earned'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
  
  -- Get client's rank
  SELECT COUNT(*) + 1
  INTO client_rank
  FROM (
    SELECT client_id, SUM(points) as total_points
    FROM public.points_transactions
    WHERE transaction_type = 'earned'
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY client_id
    HAVING SUM(points) > client_points
  ) better_ranked;
  
  -- Get total participants
  SELECT COUNT(DISTINCT client_id)
  INTO total_participants
  FROM public.points_transactions
  WHERE transaction_type = 'earned'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
  
  RETURN jsonb_build_object(
    'rank', CASE WHEN client_points > 0 THEN client_rank ELSE NULL END,
    'points_this_month', client_points,
    'total_participants', total_participants
  );
END;
$$;
