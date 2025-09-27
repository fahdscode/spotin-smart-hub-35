import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  price: number;
  status: 'pending' | 'preparing' | 'completed' | 'served';
}

export const useOrderProcessing = () => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const createOrder = async (items: Array<{ name: string; quantity: number; price: number }>, userId: string) => {
    try {
      setProcessing(true);
      
      const orderItems = items.map(item => ({
        user_id: userId,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
        status: 'pending'
      }));

      const { data, error } = await supabase
        .from('session_line_items')
        .insert(orderItems)
        .select();

      if (error) throw error;

      toast({
        title: "Order Created",
        description: `Order with ${items.length} item${items.length > 1 ? 's' : ''} has been placed successfully.`,
      });

      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderItem['status']) => {
    try {
      const { error } = await supabase
        .from('session_line_items')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Updated",
        description: `Order status updated to ${status}.`,
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const completeOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'completed');
  };

  const serveOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'served');
  };

  return {
    processing,
    createOrder,
    updateOrderStatus,
    completeOrder,
    serveOrder
  };
};