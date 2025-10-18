-- Fix the get_receptionist_active_sessions function to handle active sessions properly
CREATE OR REPLACE FUNCTION public.get_receptionist_active_sessions()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'client_code', c.client_code,
            'full_name', c.full_name,
            'phone', c.phone,
            'email', c.email,
            'barcode', c.barcode,
            'active', c.active,
            'check_in_time', COALESCE(latest_checkin.checked_in_at, c.updated_at)
        ) ORDER BY COALESCE(latest_checkin.checked_in_at, c.updated_at) DESC
    )
    INTO result
    FROM public.clients c
    LEFT JOIN (
        SELECT DISTINCT ON (client_id) 
            client_id, 
            checked_in_at
        FROM public.check_ins 
        WHERE status = 'checked_in' 
        AND checked_out_at IS NULL
        ORDER BY client_id, checked_in_at DESC
    ) latest_checkin ON c.id = latest_checkin.client_id
    WHERE c.is_active = true AND c.active = true;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$function$