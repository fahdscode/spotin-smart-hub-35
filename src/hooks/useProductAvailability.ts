import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  is_available: boolean;
  image_url?: string;
  prep_time_minutes?: number;
}

interface StockItem {
  id: string;
  name: string;
  current_quantity: number;
  unit: string;
}

interface ProductIngredient {
  stock_id: string;
  quantity_needed: number;
  stock: StockItem;
}

interface ProductWithAvailability extends Product {
  can_make: boolean;
  missing_ingredients?: string[];
  ingredients?: ProductIngredient[];
}

export const useProductAvailability = () => {
  const [products, setProducts] = useState<ProductWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProductsWithAvailability = async () => {
    try {
      setLoading(true);
      
      // Fetch products with their ingredients and stock information, excluding tickets
      const { data: productsData, error: productsError } = await supabase
        .from('drinks')
        .select(`
          *,
          product_ingredients!inner(
            stock_id,
            quantity_needed,
            stock!inner(
              id,
              name,
              current_quantity,
              unit
            )
          )
        `)
        .eq('is_available', true)
        .neq('category', 'day_use_ticket')
        .order('category', { ascending: true });

      if (productsError) throw productsError;

      // Also fetch products without ingredients
      const productIds = productsData?.map(p => p.id) || [];
      let productsWithoutIngredients = null;
      let noIngredientsError = null;
      
      if (productIds.length > 0) {
        const result = await supabase
          .from('drinks')
          .select('*')
          .eq('is_available', true)
          .neq('category', 'day_use_ticket')
          .not('id', 'in', `(${productIds.join(',')})`)
          .order('category', { ascending: true });
        productsWithoutIngredients = result.data;
        noIngredientsError = result.error;
      } else {
        // If no products with ingredients, fetch all available products (excluding tickets)
        const result = await supabase
          .from('drinks')
          .select('*')
          .eq('is_available', true)
          .neq('category', 'day_use_ticket')
          .order('category', { ascending: true });
        productsWithoutIngredients = result.data;
        noIngredientsError = result.error;
      }

      if (noIngredientsError) throw noIngredientsError;

      const processedProducts: ProductWithAvailability[] = [];

      // Process products with ingredients
      if (productsData) {
        const groupedProducts = productsData.reduce((acc, product) => {
          if (!acc[product.id]) {
            acc[product.id] = {
              ...product,
              ingredients: []
            };
          }
          
          if (product.product_ingredients && product.product_ingredients.length > 0) {
            product.product_ingredients.forEach((ingredient: any) => {
              acc[product.id].ingredients.push({
                stock_id: ingredient.stock_id,
                quantity_needed: ingredient.quantity_needed,
                stock: ingredient.stock
              });
            });
          }
          
          return acc;
        }, {} as Record<string, any>);

        Object.values(groupedProducts).forEach((product: any) => {
          const missingIngredients: string[] = [];
          let canMake = true;

          if (product.ingredients && product.ingredients.length > 0) {
            product.ingredients.forEach((ingredient: ProductIngredient) => {
              if (ingredient.stock.current_quantity < ingredient.quantity_needed) {
                canMake = false;
                missingIngredients.push(ingredient.stock.name);
              }
            });
          }

          processedProducts.push({
            ...product,
            can_make: canMake,
            missing_ingredients: missingIngredients.length > 0 ? missingIngredients : undefined
          });
        });
      }

      // Process products without ingredients (always available if marked as available)
      if (productsWithoutIngredients) {
        productsWithoutIngredients.forEach(product => {
          processedProducts.push({
            ...product,
            can_make: true,
            ingredients: []
          });
        });
      }

      setProducts(processedProducts);
    } catch (error: any) {
      toast({
        title: "Error fetching products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsWithAvailability();
  }, []);

  const checkIngredientAvailability = async (productId: string, quantity: number = 1): Promise<boolean> => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.ingredients) return true;

    for (const ingredient of product.ingredients) {
      const requiredQuantity = ingredient.quantity_needed * quantity;
      if (ingredient.stock.current_quantity < requiredQuantity) {
        return false;
      }
    }
    return true;
  };

  return {
    products,
    loading,
    refreshProducts: fetchProductsWithAvailability,
    checkIngredientAvailability
  };
};