-- Phase 1: Add safe RPCs for receptionist data access
CREATE OR REPLACE FUNCTION public.get_receptionist_active_sessions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
            'check_in_time', COALESCE(ci.checked_in_at, c.updated_at)
        )
    )
    INTO result
    FROM public.clients c
    LEFT JOIN public.check_ins ci ON c.id = ci.client_id 
        AND ci.status = 'checked_in' 
        AND ci.checked_out_at IS NULL
    WHERE c.is_active = true AND c.active = true
    ORDER BY COALESCE(ci.checked_in_at, c.updated_at) DESC;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_receptionist_daily_registrations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    count_result integer;
BEGIN
    SELECT COUNT(*)
    INTO count_result
    FROM public.clients
    WHERE DATE(created_at) = CURRENT_DATE;
    
    RETURN COALESCE(count_result, 0);
END;
$$;

-- Phase 2: Create client_memberships table and management RPCs
CREATE TABLE IF NOT EXISTS public.client_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    plan_name text NOT NULL,
    discount_percentage integer NOT NULL DEFAULT 0,
    perks text[] DEFAULT '{}',
    start_date date NOT NULL DEFAULT CURRENT_DATE,
    end_date date,
    is_active boolean NOT NULL DEFAULT true,
    total_savings numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Enable RLS on client_memberships
ALTER TABLE public.client_memberships ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_memberships
CREATE POLICY "Staff can view all client memberships"
ON public.client_memberships
FOR SELECT
USING (is_admin_or_staff());

CREATE POLICY "Staff can manage client memberships"
ON public.client_memberships
FOR ALL
USING (is_admin_or_staff());

-- Add trigger for updated_at
CREATE TRIGGER update_client_memberships_updated_at
    BEFORE UPDATE ON public.client_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RPC to assign membership to client
CREATE OR REPLACE FUNCTION public.assign_client_membership(
    p_client_id uuid,
    p_plan_name text,
    p_discount_percentage integer,
    p_perks text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    client_record record;
    membership_id uuid;
BEGIN
    -- Check if client exists
    SELECT id, full_name INTO client_record
    FROM public.clients
    WHERE id = p_client_id AND is_active = true;
    
    IF client_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Client not found'
        );
    END IF;
    
    -- Deactivate any existing memberships for this client
    UPDATE public.client_memberships
    SET is_active = false, updated_at = now()
    WHERE client_id = p_client_id AND is_active = true;
    
    -- Create new membership
    INSERT INTO public.client_memberships (
        client_id,
        plan_name,
        discount_percentage,
        perks,
        is_active
    )
    VALUES (
        p_client_id,
        p_plan_name,
        p_discount_percentage,
        p_perks,
        true
    )
    RETURNING id INTO membership_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'membership_id', membership_id,
        'message', 'Membership assigned successfully to ' || client_record.full_name
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Failed to assign membership: ' || SQLERRM
    );
END;
$$;

-- RPC to get client memberships
CREATE OR REPLACE FUNCTION public.get_client_memberships()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', cm.id,
            'client', jsonb_build_object(
                'id', c.id,
                'full_name', c.full_name,
                'client_code', c.client_code,
                'phone', c.phone,
                'email', c.email
            ),
            'plan_name', cm.plan_name,
            'discount_percentage', cm.discount_percentage,
            'perks', cm.perks,
            'start_date', cm.start_date,
            'end_date', cm.end_date,
            'is_active', cm.is_active,
            'total_savings', cm.total_savings,
            'created_at', cm.created_at
        ) ORDER BY cm.created_at DESC
    )
    INTO result
    FROM public.client_memberships cm
    JOIN public.clients c ON cm.client_id = c.id
    WHERE c.is_active = true;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- RPC to search clients for membership assignment
CREATE OR REPLACE FUNCTION public.search_clients_for_membership(search_term text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
            'active', c.active,
            'current_membership', CASE 
                WHEN cm.id IS NOT NULL THEN jsonb_build_object(
                    'plan_name', cm.plan_name,
                    'discount_percentage', cm.discount_percentage
                )
                ELSE null
            END
        ) ORDER BY c.full_name
    )
    INTO result
    FROM public.clients c
    LEFT JOIN public.client_memberships cm ON c.id = cm.client_id AND cm.is_active = true
    WHERE c.is_active = true
    AND (
        LOWER(c.full_name) LIKE LOWER('%' || search_term || '%')
        OR LOWER(c.phone) LIKE LOWER('%' || search_term || '%')
        OR LOWER(c.client_code) LIKE LOWER('%' || search_term || '%')
        OR LOWER(COALESCE(c.email, '')) LIKE LOWER('%' || search_term || '%')
    )
    LIMIT 20;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;