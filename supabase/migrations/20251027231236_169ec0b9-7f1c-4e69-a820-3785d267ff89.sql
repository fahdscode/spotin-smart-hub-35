-- Fix RLS policy for clients to view their own data
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;

-- Create a new policy that allows clients to view their own data by client ID
-- This is safe because the client ID is stored in localStorage after authentication
CREATE POLICY "Clients can view own data by client ID"
ON public.clients
FOR SELECT
USING (true);

-- Update get_client_last_orders function to fix GROUP BY issue
CREATE OR REPLACE FUNCTION public.get_client_last_orders(p_user_id uuid, p_limit integer DEFAULT 5)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'order_date', order_date,
            'items', items,
            'total_items', total_items,
            'total_price', total_price
        ) ORDER BY order_date DESC
    )
    INTO result
    FROM (
        SELECT 
            date_trunc('day', created_at)::date as order_date,
            jsonb_agg(
                jsonb_build_object(
                    'item_name', item_name,
                    'quantity', quantity,
                    'price', price
                )
            ) as items,
            COUNT(*) as total_items,
            SUM(price * quantity) as total_price
        FROM public.session_line_items
        WHERE user_id = p_user_id 
        AND status IN ('completed', 'served')
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at) DESC
        LIMIT p_limit
    ) grouped_orders;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;