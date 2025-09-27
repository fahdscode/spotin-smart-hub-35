-- First, clean up existing data and add realistic coworking space products and ingredients

-- Clear existing product ingredients relationships
DELETE FROM public.product_ingredients;

-- Clear existing drinks
DELETE FROM public.drinks;

-- Clear existing stock and add realistic ingredients
DELETE FROM public.stock;

-- Add realistic stock ingredients for coworking space
INSERT INTO public.stock (name, unit, current_quantity, min_quantity, cost_per_unit, category, supplier, is_active) VALUES
-- Coffee ingredients
('Coffee Beans (Arabica)', 'kg', 25.0, 5.0, 18.50, 'beverage', 'Premium Coffee Co.', true),
('Coffee Beans (Robusta)', 'kg', 15.0, 3.0, 14.20, 'beverage', 'Premium Coffee Co.', true),
('Whole Milk', 'liter', 45.0, 10.0, 2.80, 'dairy', 'Fresh Dairy Farm', true),
('Oat Milk', 'liter', 20.0, 5.0, 4.50, 'dairy', 'Plant Alternatives', true),
('Almond Milk', 'liter', 18.0, 4.0, 4.20, 'dairy', 'Plant Alternatives', true),
('Soy Milk', 'liter', 15.0, 3.0, 3.90, 'dairy', 'Plant Alternatives', true),
('Vanilla Syrup', 'ml', 800.0, 200.0, 0.08, 'flavoring', 'Flavor Masters', true),
('Caramel Syrup', 'ml', 750.0, 200.0, 0.09, 'flavoring', 'Flavor Masters', true),
('Sugar', 'kg', 10.0, 2.0, 1.50, 'sweetener', 'Local Supplier', true),
('Honey', 'kg', 5.0, 1.0, 12.00, 'sweetener', 'Local Bee Farm', true),

-- Tea ingredients
('Earl Grey Tea', 'tea_bags', 500, 100, 0.25, 'beverage', 'Tea Masters', true),
('English Breakfast Tea', 'tea_bags', 450, 100, 0.22, 'beverage', 'Tea Masters', true),
('Green Tea', 'tea_bags', 300, 80, 0.30, 'beverage', 'Tea Masters', true),
('Chamomile Tea', 'tea_bags', 200, 50, 0.35, 'beverage', 'Tea Masters', true),
('Peppermint Tea', 'tea_bags', 180, 40, 0.32, 'beverage', 'Tea Masters', true),
('Lemon', 'piece', 30, 10, 0.50, 'fruit', 'Fresh Fruits Co.', true),

-- Fresh juice ingredients
('Orange', 'piece', 100, 20, 0.75, 'fruit', 'Fresh Fruits Co.', true),
('Apple', 'piece', 80, 15, 0.60, 'fruit', 'Fresh Fruits Co.', true),
('Carrot', 'piece', 60, 15, 0.40, 'vegetable', 'Fresh Produce', true),
('Ginger', 'kg', 2.0, 0.5, 8.00, 'spice', 'Spice Market', true),
('Spinach', 'kg', 5.0, 1.0, 4.50, 'vegetable', 'Fresh Produce', true),
('Banana', 'piece', 40, 10, 0.35, 'fruit', 'Fresh Fruits Co.', true),
('Strawberry', 'kg', 3.0, 0.5, 12.00, 'fruit', 'Berry Farm', true),
('Mango', 'piece', 20, 5, 2.50, 'fruit', 'Tropical Fruits', true),

-- Food ingredients
('Whole Wheat Bread', 'loaf', 15, 5, 3.20, 'bakery', 'Local Bakery', true),
('White Bread', 'loaf', 12, 4, 2.80, 'bakery', 'Local Bakery', true),
('Turkey Slices', 'kg', 3.0, 0.5, 15.50, 'protein', 'Deli Meats Co.', true),
('Ham Slices', 'kg', 2.5, 0.5, 14.20, 'protein', 'Deli Meats Co.', true),
('Cheese Slices', 'kg', 2.0, 0.3, 18.00, 'dairy', 'Cheese Masters', true),
('Lettuce', 'head', 10, 3, 1.80, 'vegetable', 'Fresh Produce', true),
('Tomato', 'piece', 25, 8, 0.80, 'vegetable', 'Fresh Produce', true),
('Cucumber', 'piece', 15, 5, 1.20, 'vegetable', 'Fresh Produce', true),
('Avocado', 'piece', 12, 3, 2.50, 'fruit', 'Fresh Fruits Co.', true),
('Chicken Breast', 'kg', 4.0, 1.0, 22.00, 'protein', 'Fresh Poultry', true),
('Tortilla Wraps', 'piece', 30, 10, 0.45, 'bakery', 'Local Bakery', true),
('Mixed Greens', 'kg', 3.0, 1.0, 8.50, 'vegetable', 'Fresh Produce', true),
('Feta Cheese', 'kg', 1.5, 0.3, 16.00, 'dairy', 'Cheese Masters', true),
('Olives', 'kg', 2.0, 0.5, 12.50, 'condiment', 'Mediterranean Co.', true),
('Croissant', 'piece', 20, 8, 1.80, 'bakery', 'French Bakery', true),
('Muffin Mix', 'kg', 5.0, 1.0, 6.50, 'bakery', 'Baking Supplies', true),
('Chocolate Chips', 'kg', 2.0, 0.5, 8.90, 'baking', 'Sweet Supplies', true),
('Blueberries', 'kg', 1.5, 0.3, 15.00, 'fruit', 'Berry Farm', true),

-- Snack ingredients
('Mixed Nuts', 'kg', 5.0, 1.0, 18.50, 'snack', 'Nut Company', true),
('Granola', 'kg', 3.0, 0.8, 12.00, 'snack', 'Healthy Snacks', true),
('Potato Chips', 'bag', 25, 8, 2.50, 'snack', 'Crispy Foods', true),
('Energy Bar Base', 'kg', 2.0, 0.5, 16.00, 'snack', 'Health Foods', true),
('Pretzels', 'kg', 3.0, 1.0, 7.50, 'snack', 'Salty Snacks Co.', true);

-- Add realistic drinks/products with proper categories and prep times
INSERT INTO public.drinks (name, category, price, description, is_available) VALUES
-- Coffee drinks
('Americano', 'coffee', 4.50, 'Rich espresso with hot water', true),
('Latte', 'coffee', 5.50, 'Espresso with steamed milk and light foam', true),
('Cappuccino', 'coffee', 5.00, 'Equal parts espresso, steamed milk, and foam', true),
('Espresso', 'coffee', 3.50, 'Pure concentrated coffee shot', true),
('Flat White', 'coffee', 5.25, 'Double espresso with microfoam milk', true),
('Mocha', 'coffee', 6.00, 'Espresso with chocolate and steamed milk', true),
('Cold Brew', 'coffee', 4.75, 'Smooth cold-extracted coffee served over ice', true),

-- Coffee add-ons
('Extra Espresso Shot', 'add_on', 1.00, 'Additional espresso shot for any drink', true),
('Oat Milk Upgrade', 'add_on', 0.75, 'Replace regular milk with oat milk', true),
('Almond Milk Upgrade', 'add_on', 0.75, 'Replace regular milk with almond milk', true),
('Soy Milk Upgrade', 'add_on', 0.70, 'Replace regular milk with soy milk', true),
('Vanilla Syrup', 'add_on', 0.50, 'Add vanilla flavoring to any drink', true),
('Caramel Syrup', 'add_on', 0.55, 'Add caramel flavoring to any drink', true),

-- Tea drinks
('Earl Grey Tea', 'tea', 3.50, 'Classic bergamot-flavored black tea', true),
('English Breakfast Tea', 'tea', 3.25, 'Traditional full-bodied black tea', true),
('Green Tea', 'tea', 3.75, 'Light and refreshing antioxidant-rich tea', true),
('Chamomile Tea', 'tea', 4.00, 'Soothing herbal tea perfect for relaxation', true),
('Peppermint Tea', 'tea', 3.75, 'Refreshing mint herbal tea', true),

-- Fresh juices and smoothies
('Fresh Orange Juice', 'juice', 5.50, 'Freshly squeezed orange juice', true),
('Fresh Apple Juice', 'juice', 5.25, 'Crisp apple juice made fresh daily', true),
('Carrot Ginger Juice', 'juice', 6.00, 'Healthy carrot juice with fresh ginger kick', true),
('Green Smoothie', 'smoothie', 7.50, 'Spinach, apple, banana, and ginger blend', true),
('Berry Smoothie', 'smoothie', 8.00, 'Strawberry, banana, and honey blend', true),
('Tropical Smoothie', 'smoothie', 8.50, 'Mango, banana, and orange blend', true),

-- Food items
('Club Sandwich', 'food', 12.50, 'Turkey, ham, cheese, lettuce, tomato on toasted bread', true),
('Turkey Sandwich', 'food', 9.50, 'Sliced turkey with cheese and fresh vegetables', true),
('Veggie Wrap', 'food', 8.75, 'Fresh vegetables and avocado in whole wheat tortilla', true),
('Chicken Caesar Wrap', 'food', 11.00, 'Grilled chicken with caesar salad in tortilla', true),
('Greek Salad', 'food', 10.50, 'Mixed greens, feta cheese, olives, and vegetables', true),
('Garden Salad', 'food', 8.50, 'Fresh mixed greens with seasonal vegetables', true),
('Fruit Salad', 'food', 7.00, 'Seasonal fresh fruit medley', true),

-- Pastries and baked goods
('Butter Croissant', 'pastry', 3.50, 'Flaky French butter croissant', true),
('Chocolate Croissant', 'pastry', 4.25, 'Buttery croissant with chocolate filling', true),
('Blueberry Muffin', 'pastry', 4.00, 'Fresh baked muffin with blueberries', true),
('Chocolate Chip Muffin', 'pastry', 4.00, 'Classic muffin with chocolate chips', true),
('Banana Muffin', 'pastry', 3.75, 'Moist banana muffin with walnuts', true),

-- Snacks
('Mixed Nuts', 'snack', 4.50, 'Premium mix of roasted nuts', true),
('Granola Bar', 'snack', 3.25, 'Healthy oats and honey granola bar', true),
('Potato Chips', 'snack', 2.75, 'Crispy salted potato chips', true),
('Energy Bar', 'snack', 4.75, 'High-protein energy bar with nuts and fruits', true),
('Pretzels', 'snack', 3.00, 'Salted twisted pretzels', true);

-- Create product-ingredient relationships for main coffee drinks
-- Americano (Coffee beans + water)
INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 0.018
FROM public.drinks d, public.stock s
WHERE d.name = 'Americano' AND s.name = 'Coffee Beans (Arabica)';

-- Latte (Coffee beans + milk)
INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 0.018
FROM public.drinks d, public.stock s
WHERE d.name = 'Latte' AND s.name = 'Coffee Beans (Arabica)';

INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 0.200
FROM public.drinks d, public.stock s
WHERE d.name = 'Latte' AND s.name = 'Whole Milk';

-- Cappuccino (Coffee beans + milk)
INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 0.018
FROM public.drinks d, public.stock s
WHERE d.name = 'Cappuccino' AND s.name = 'Coffee Beans (Arabica)';

INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 0.150
FROM public.drinks d, public.stock s
WHERE d.name = 'Cappuccino' AND s.name = 'Whole Milk';

-- Espresso (Just coffee beans)
INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 0.018
FROM public.drinks d, public.stock s
WHERE d.name = 'Espresso' AND s.name = 'Coffee Beans (Arabica)';

-- Flat White (Coffee beans + milk)
INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 0.020
FROM public.drinks d, public.stock s
WHERE d.name = 'Flat White' AND s.name = 'Coffee Beans (Arabica)';

INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 0.180
FROM public.drinks d, public.stock s
WHERE d.name = 'Flat White' AND s.name = 'Whole Milk';

-- Tea drinks (1 tea bag each)
INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 1
FROM public.drinks d, public.stock s
WHERE d.name = 'Earl Grey Tea' AND s.name = 'Earl Grey Tea';

INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 1
FROM public.drinks d, public.stock s
WHERE d.name = 'English Breakfast Tea' AND s.name = 'English Breakfast Tea';

INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 1
FROM public.drinks d, public.stock s
WHERE d.name = 'Green Tea' AND s.name = 'Green Tea';

-- Fresh juices
INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 3
FROM public.drinks d, public.stock s
WHERE d.name = 'Fresh Orange Juice' AND s.name = 'Orange';

INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 2
FROM public.drinks d, public.stock s
WHERE d.name = 'Fresh Apple Juice' AND s.name = 'Apple';

-- Green Smoothie
INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 0.050
FROM public.drinks d, public.stock s
WHERE d.name = 'Green Smoothie' AND s.name = 'Spinach';

INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 1
FROM public.drinks d, public.stock s
WHERE d.name = 'Green Smoothie' AND s.name = 'Apple';

INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 1
FROM public.drinks d, public.stock s
WHERE d.name = 'Green Smoothie' AND s.name = 'Banana';

-- Club Sandwich
INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 0.1
FROM public.drinks d, public.stock s
WHERE d.name = 'Club Sandwich' AND s.name = 'Whole Wheat Bread';

INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 0.080
FROM public.drinks d, public.stock s
WHERE d.name = 'Club Sandwich' AND s.name = 'Turkey Slices';

INSERT INTO public.product_ingredients (product_id, stock_id, quantity_needed)
SELECT d.id, s.id, 0.050
FROM public.drinks d, public.stock s
WHERE d.name = 'Club Sandwich' AND s.name = 'Ham Slices';

-- Add prep_time column to drinks table
ALTER TABLE public.drinks ADD COLUMN IF NOT EXISTS prep_time_minutes integer DEFAULT 2;

-- Update prep times for different product categories
UPDATE public.drinks SET prep_time_minutes = 3 WHERE category = 'coffee' AND name IN ('Americano', 'Espresso');
UPDATE public.drinks SET prep_time_minutes = 4 WHERE category = 'coffee' AND name IN ('Latte', 'Cappuccino', 'Flat White');
UPDATE public.drinks SET prep_time_minutes = 5 WHERE category = 'coffee' AND name = 'Mocha';
UPDATE public.drinks SET prep_time_minutes = 2 WHERE category = 'tea';
UPDATE public.drinks SET prep_time_minutes = 1 WHERE category = 'add_on';
UPDATE public.drinks SET prep_time_minutes = 3 WHERE category = 'juice';
UPDATE public.drinks SET prep_time_minutes = 4 WHERE category = 'smoothie';
UPDATE public.drinks SET prep_time_minutes = 8 WHERE category = 'food' AND name LIKE '%Sandwich%';
UPDATE public.drinks SET prep_time_minutes = 10 WHERE category = 'food' AND name LIKE '%Wrap%';
UPDATE public.drinks SET prep_time_minutes = 6 WHERE category = 'food' AND name LIKE '%Salad%';
UPDATE public.drinks SET prep_time_minutes = 2 WHERE category = 'pastry';
UPDATE public.drinks SET prep_time_minutes = 1 WHERE category = 'snack';