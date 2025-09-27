import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StockItem {
  id: string;
  name: string;
  current_quantity: number;
  min_quantity: number;
  cost_per_unit: number;
  unit: string;
  category: string;
  supplier: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockItemWithStatus extends StockItem {
  status: 'critical' | 'low' | 'good';
  maximum: number;
}

export const useStockData = () => {
  const [stockItems, setStockItems] = useState<StockItemWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Transform data and add status
      const transformedData: StockItemWithStatus[] = (data || []).map(item => {
        const currentQty = item.current_quantity;
        const minQty = item.min_quantity;
        const maxQty = minQty * 4; // Estimate max as 4x min
        
        let status: 'critical' | 'low' | 'good' = 'good';
        if (currentQty <= minQty * 0.5) status = 'critical';
        else if (currentQty <= minQty) status = 'low';

        return {
          ...item,
          status,
          maximum: maxQty
        };
      });

      setStockItems(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const getCriticalStockCount = () => {
    return stockItems.filter(item => item.status === 'critical' || item.status === 'low').length;
  };

  const getTotalInventoryValue = () => {
    return stockItems.reduce((total, item) => total + (item.current_quantity * item.cost_per_unit), 0);
  };

  const getStockStatusCounts = () => {
    return {
      critical: stockItems.filter(item => item.status === 'critical').length,
      low: stockItems.filter(item => item.status === 'low').length,
      good: stockItems.filter(item => item.status === 'good').length
    };
  };

  return {
    stockItems,
    loading,
    error,
    refetch: fetchStockData,
    getCriticalStockCount,
    getTotalInventoryValue,
    getStockStatusCounts
  };
};