-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Create storage policies for product image uploads
CREATE POLICY "Staff can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'products' AND is_admin_or_staff());

CREATE POLICY "Anyone can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Staff can update product images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'product-images' AND is_admin_or_staff());

CREATE POLICY "Staff can delete product images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'product-images' AND is_admin_or_staff());

-- Create stock table for ingredients inventory
CREATE TABLE public.stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'piece', -- kg, liter, piece, etc.
  current_quantity NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  category TEXT NOT NULL DEFAULT 'ingredient',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stock table
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

-- Create policies for stock table
CREATE POLICY "Staff can view all stock" 
ON public.stock 
FOR SELECT 
USING (is_admin_or_staff());

CREATE POLICY "Staff can manage stock" 
ON public.stock 
FOR ALL 
USING (is_admin_or_staff());

-- Create product ingredients table to track ingredient usage
CREATE TABLE public.product_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.drinks(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stock(id) ON DELETE CASCADE,
  quantity_needed NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, stock_id)
);

-- Enable RLS on product ingredients table
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

-- Create policies for product ingredients table
CREATE POLICY "Staff can view all product ingredients" 
ON public.product_ingredients 
FOR SELECT 
USING (is_admin_or_staff());

CREATE POLICY "Staff can manage product ingredients" 
ON public.product_ingredients 
FOR ALL 
USING (is_admin_or_staff());

-- Create trigger to update stock quantities when products are ordered
CREATE OR REPLACE FUNCTION public.update_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    ingredient_record RECORD;
BEGIN
    -- Only process when status changes to 'completed' or 'served'
    IF NEW.status IN ('completed', 'served') AND OLD.status NOT IN ('completed', 'served') THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on session_line_items
CREATE TRIGGER update_stock_on_order_trigger
    AFTER UPDATE ON public.session_line_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_stock_on_order();

-- Add some sample stock items
INSERT INTO public.stock (name, unit, current_quantity, min_quantity, cost_per_unit, category) VALUES
('Coffee Beans', 'kg', 50.0, 5.0, 25.00, 'ingredient'),
('Milk', 'liter', 20.0, 2.0, 8.50, 'ingredient'),
('Sugar', 'kg', 15.0, 2.0, 5.00, 'ingredient'),
('Cocoa Powder', 'kg', 3.0, 0.5, 45.00, 'ingredient'),
('Vanilla Extract', 'ml', 500.0, 50.0, 0.15, 'ingredient'),
('Whipped Cream', 'can', 10.0, 2.0, 12.00, 'ingredient'),
('Cinnamon', 'kg', 2.0, 0.2, 35.00, 'ingredient'),
('Honey', 'kg', 5.0, 1.0, 18.00, 'ingredient'),
('Tea Leaves', 'kg', 8.0, 1.0, 30.00, 'ingredient'),
('Lemon', 'piece', 25.0, 5.0, 1.50, 'ingredient');

-- Update updated_at trigger for stock and product_ingredients
CREATE TRIGGER update_stock_updated_at
BEFORE UPDATE ON public.stock
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_ingredients_updated_at
BEFORE UPDATE ON public.product_ingredients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();