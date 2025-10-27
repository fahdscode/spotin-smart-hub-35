-- Create function to get top 10 products by sales
CREATE OR REPLACE FUNCTION public.get_top_products_by_sales(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_limit INTEGER DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'product_name', item_name,
      'total_quantity', total_quantity,
      'total_revenue', total_revenue,
      'order_count', order_count,
      'avg_price', avg_price
    ) ORDER BY total_revenue DESC
  )
  INTO result
  FROM (
    SELECT 
      item_name,
      SUM(quantity) as total_quantity,
      SUM(price * quantity) as total_revenue,
      COUNT(DISTINCT id) as order_count,
      AVG(price) as avg_price
    FROM public.session_line_items
    WHERE created_at BETWEEN p_start_date AND p_end_date
    AND status IN ('completed', 'served')
    GROUP BY item_name
    ORDER BY total_revenue DESC
    LIMIT p_limit
  ) product_stats;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

COMMENT ON FUNCTION public.get_top_products_by_sales IS 'Returns top N products by total revenue with sales statistics';

-- Create function to get product sales trends (daily breakdown)
CREATE OR REPLACE FUNCTION public.get_product_sales_trends(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_top_n INTEGER DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  top_products TEXT[];
BEGIN
  -- Get top N products first
  SELECT ARRAY_AGG(item_name)
  INTO top_products
  FROM (
    SELECT item_name
    FROM public.session_line_items
    WHERE created_at::DATE BETWEEN p_start_date AND p_end_date
    AND status IN ('completed', 'served')
    GROUP BY item_name
    ORDER BY SUM(price * quantity) DESC
    LIMIT p_top_n
  ) top_items;
  
  -- Get daily sales for top products
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', sale_date,
      'product_name', item_name,
      'quantity', daily_quantity,
      'revenue', daily_revenue
    ) ORDER BY sale_date, item_name
  )
  INTO result
  FROM (
    SELECT 
      created_at::DATE as sale_date,
      item_name,
      SUM(quantity) as daily_quantity,
      SUM(price * quantity) as daily_revenue
    FROM public.session_line_items
    WHERE created_at::DATE BETWEEN p_start_date AND p_end_date
    AND status IN ('completed', 'served')
    AND item_name = ANY(top_products)
    GROUP BY created_at::DATE, item_name
    ORDER BY sale_date, item_name
  ) daily_stats;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

COMMENT ON FUNCTION public.get_product_sales_trends IS 'Returns daily sales trends for top N products';