-- Create promotions table for managing sales, discounts, and combos
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('percentage', 'fixed_amount', 'combo', 'buy_x_get_y', 'category_discount')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  applicable_to TEXT NOT NULL DEFAULT 'all' CHECK (applicable_to IN ('all', 'specific_products', 'specific_category', 'combo')),
  product_ids UUID[] DEFAULT '{}',
  category TEXT,
  combo_items JSONB DEFAULT '[]',
  min_purchase_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_limit INTEGER,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.promotions IS 'Store sales promotions, discounts, and combo offers';
COMMENT ON COLUMN public.promotions.promotion_type IS 'Type of promotion: percentage, fixed_amount, combo, buy_x_get_y, category_discount';
COMMENT ON COLUMN public.promotions.discount_value IS 'Percentage or fixed amount value';
COMMENT ON COLUMN public.promotions.applicable_to IS 'What the promotion applies to';
COMMENT ON COLUMN public.promotions.product_ids IS 'Array of product IDs for specific product promotions';
COMMENT ON COLUMN public.promotions.combo_items IS 'JSON array of combo items with quantities';
COMMENT ON COLUMN public.promotions.min_purchase_amount IS 'Minimum purchase amount to qualify';
COMMENT ON COLUMN public.promotions.max_discount_amount IS 'Maximum discount cap for percentage discounts';

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view active promotions"
  ON public.promotions
  FOR SELECT
  USING (is_active = true AND (end_date IS NULL OR end_date > NOW()));

CREATE POLICY "Staff can manage promotions"
  ON public.promotions
  FOR ALL
  USING (is_admin_or_staff());

-- Create index for performance
CREATE INDEX idx_promotions_active ON public.promotions(is_active, start_date, end_date);
CREATE INDEX idx_promotions_type ON public.promotions(promotion_type);
CREATE INDEX idx_promotions_category ON public.promotions(category) WHERE category IS NOT NULL;