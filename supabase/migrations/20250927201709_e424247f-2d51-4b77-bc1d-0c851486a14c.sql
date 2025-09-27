-- Add cancelled status to session_line_items and update trigger
-- Update the trigger that handles stock deduction to only process completed/served orders

-- First, let's ensure the trigger only processes completed/served orders, not cancelled
DROP TRIGGER IF EXISTS update_stock_on_order_trigger ON public.session_line_items;

CREATE OR REPLACE FUNCTION public.update_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ingredient_record RECORD;
BEGIN
    -- Only process when status changes to 'completed' or 'served' (not cancelled)
    IF NEW.status IN ('completed', 'served') AND 
       OLD.status NOT IN ('completed', 'served') AND 
       NEW.status != 'cancelled' THEN
        
        -- Get the product ingredients and deduct from stock
        FOR ingredient_record IN 
            SELECT pi.stock_id, pi.quantity_needed * NEW.quantity as total_needed
            FROM public.product_ingredients pi
            JOIN public.drinks d ON pi.product_id = d.id
            WHERE d.name = NEW.item_name
        LOOP
            -- Update stock quantity
            UPDATE public.stock 
            SET current_quantity = current_quantity - ingredient_record.total_needed,
                updated_at = now()
            WHERE id = ingredient_record.stock_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_stock_on_order_trigger
BEFORE UPDATE ON public.session_line_items
FOR EACH ROW
EXECUTE FUNCTION public.update_stock_on_order();