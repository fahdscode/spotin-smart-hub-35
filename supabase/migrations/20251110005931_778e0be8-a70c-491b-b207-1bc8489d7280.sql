-- Update stock trigger to handle restocking when orders are cancelled
-- and add trigger to un-claim free drinks when cancelled

-- Drop existing trigger
DROP TRIGGER IF EXISTS update_stock_on_order_trigger ON public.session_line_items;

-- Update function to handle both deduction (on complete) and restocking (on cancel)
CREATE OR REPLACE FUNCTION public.update_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ingredient_record RECORD;
BEGIN
    -- Deduct stock when status changes to 'completed' or 'served' (not cancelled)
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
            -- Deduct stock quantity
            UPDATE public.stock 
            SET current_quantity = current_quantity - ingredient_record.total_needed,
                updated_at = now()
            WHERE id = ingredient_record.stock_id;
        END LOOP;
    END IF;
    
    -- Restock when order is cancelled (from any previous status)
    IF NEW.status = 'cancelled' AND OLD.status IN ('completed', 'served') THEN
        
        -- Get the product ingredients and add back to stock
        FOR ingredient_record IN 
            SELECT pi.stock_id, pi.quantity_needed * NEW.quantity as total_needed
            FROM public.product_ingredients pi
            JOIN public.drinks d ON pi.product_id = d.id
            WHERE d.name = NEW.item_name
        LOOP
            -- Add back stock quantity
            UPDATE public.stock 
            SET current_quantity = current_quantity + ingredient_record.total_needed,
                updated_at = now()
            WHERE id = ingredient_record.stock_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_stock_on_order_trigger
AFTER UPDATE ON public.session_line_items
FOR EACH ROW
EXECUTE FUNCTION public.update_stock_on_order();

-- Create function to un-claim free drink when order is cancelled
CREATE OR REPLACE FUNCTION public.unclaim_free_drink_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ticket_to_unclaim UUID;
BEGIN
    -- When order is cancelled and it was a free drink (price = 0 and has note about ticket)
    IF NEW.status = 'cancelled' AND 
       OLD.status != 'cancelled' AND 
       NEW.price = 0 AND 
       NEW.notes LIKE '%Free drink from ticket:%' THEN
        
        -- Find the most recent claimed ticket for this client and drink
        SELECT id INTO ticket_to_unclaim
        FROM public.client_tickets
        WHERE client_id = NEW.user_id
          AND free_drink_claimed = true
          AND claimed_drink_name = NEW.item_name
          AND free_drink_claimed_at >= (NEW.created_at - INTERVAL '5 minutes')
        ORDER BY free_drink_claimed_at DESC
        LIMIT 1;
        
        -- If found, un-claim it
        IF ticket_to_unclaim IS NOT NULL THEN
            UPDATE public.client_tickets
            SET free_drink_claimed = false,
                free_drink_claimed_at = NULL,
                claimed_drink_name = NULL
            WHERE id = ticket_to_unclaim;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for un-claiming free drinks
CREATE TRIGGER unclaim_free_drink_on_cancel_trigger
AFTER UPDATE ON public.session_line_items
FOR EACH ROW
EXECUTE FUNCTION public.unclaim_free_drink_on_cancel();