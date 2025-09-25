-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_bill_amount()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.bills 
    SET amount = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM public.bill_line_items 
        WHERE bill_id = COALESCE(NEW.bill_id, OLD.bill_id)
    )
    WHERE id = COALESCE(NEW.bill_id, OLD.bill_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;