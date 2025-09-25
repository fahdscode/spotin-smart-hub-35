-- Create vendors table
CREATE TABLE public.vendors (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    contact_email text,
    contact_phone text,
    address text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create bills table
CREATE TABLE public.bills (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id uuid NOT NULL REFERENCES public.vendors(id),
    bill_number text NOT NULL UNIQUE,
    amount numeric NOT NULL DEFAULT 0,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create bill line items table
CREATE TABLE public.bill_line_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    stock_id uuid NOT NULL REFERENCES public.stock(id),
    quantity numeric NOT NULL,
    unit_price numeric NOT NULL,
    total_price numeric NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_line_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendors
CREATE POLICY "Staff can view all vendors" 
ON public.vendors 
FOR SELECT 
USING (is_admin_or_staff());

CREATE POLICY "Operations staff can manage vendors" 
ON public.vendors 
FOR ALL 
USING (is_admin_or_staff());

-- Create RLS policies for bills
CREATE POLICY "Staff can view all bills" 
ON public.bills 
FOR SELECT 
USING (is_admin_or_staff());

CREATE POLICY "Operations staff can manage bills" 
ON public.bills 
FOR ALL 
USING (is_admin_or_staff());

-- Create RLS policies for bill line items
CREATE POLICY "Staff can view all bill line items" 
ON public.bill_line_items 
FOR SELECT 
USING (is_admin_or_staff());

CREATE POLICY "Operations staff can manage bill line items" 
ON public.bill_line_items 
FOR ALL 
USING (is_admin_or_staff());

-- Create function to update updated_at column
CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON public.bills
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically update bill amount when line items change
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
$$ LANGUAGE plpgsql;

-- Create triggers to update bill amount when line items change
CREATE TRIGGER update_bill_amount_on_insert
    AFTER INSERT ON public.bill_line_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_bill_amount();

CREATE TRIGGER update_bill_amount_on_update
    AFTER UPDATE ON public.bill_line_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_bill_amount();

CREATE TRIGGER update_bill_amount_on_delete
    AFTER DELETE ON public.bill_line_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_bill_amount();