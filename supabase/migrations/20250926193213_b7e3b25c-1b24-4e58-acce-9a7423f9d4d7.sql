-- Create function to get client's last orders for reordering
CREATE OR REPLACE FUNCTION public.get_client_last_orders(p_user_id uuid, p_limit integer DEFAULT 5)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'order_date', date_trunc('day', created_at)::date,
            'items', items,
            'total_items', total_items,
            'total_price', total_price
        ) ORDER BY order_date DESC
    )
    INTO result
    FROM (
        SELECT 
            created_at,
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