import { useState } from 'react';
import { useOrderProcessing } from './useOrderProcessing';
import { usePaymentProcessing } from './usePaymentProcessing';
import { useReceiptProcessing } from './useReceiptProcessing';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface OrderWorkflowData {
  userId: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
    category: 'product' | 'room' | 'ticket';
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName: string;
  customerEmail?: string;
}

export const useCompleteOrderWorkflow = () => {
  const [processing, setProcessing] = useState(false);
  const { createOrder } = useOrderProcessing();
  const { processPayment } = usePaymentProcessing();
  const { createReceipt, generateReceiptNumber } = useReceiptProcessing();
  const { toast } = useToast();

  const processCompleteOrder = async (workflowData: OrderWorkflowData) => {
    try {
      setProcessing(true);

      // Step 1: Create order items in session_line_items
      // Step 1: Creating order items
      const orderItems = workflowData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      await createOrder(orderItems, workflowData.userId);

      // Step 2: Process payment and create receipt
      // Step 2: Processing payment
      const paymentData = {
        userId: workflowData.userId,
        items: workflowData.items.map(item => ({
          item_name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        subtotal: workflowData.subtotal,
        discount: workflowData.discount,
        total: workflowData.total,
        paymentMethod: workflowData.paymentMethod as 'cash' | 'card' | 'mobile',
        transactionType: 'order' as const
      };

      const paymentResult = await processPayment(paymentData);

      // Step 3: Update stock for products that consume ingredients
      // Step 3: Updating stock
      await updateStockForOrder(workflowData.items);

      // Step 4: Generate receipt
      // Step 4: Creating receipt
      const receiptData = {
        receiptNumber: generateReceiptNumber(),
        customerName: workflowData.customerName,
        items: workflowData.items,
        subtotal: workflowData.subtotal,
        discount: workflowData.discount,
        total: workflowData.total,
        paymentMethod: workflowData.paymentMethod,
        userId: workflowData.userId
      };

      await createReceipt(receiptData);

      toast({
        title: "Order Complete",
        description: `Order processed successfully. Receipt: ${paymentResult.receiptNumber}`,
      });

      return {
        success: true,
        receiptNumber: paymentResult.receiptNumber,
        receiptData
      };
    } catch (error) {
      console.error('Error processing complete order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to process order. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const updateStockForOrder = async (items: OrderWorkflowData['items']) => {
    for (const item of items) {
      if (item.category === 'product') {
        try {
          // Get product ingredients and deduct from stock
          const { data: productIngredients, error } = await supabase
            .from('product_ingredients')
            .select(`
              quantity_needed,
              stock:stock!product_ingredients_stock_id_fkey (
                id,
                current_quantity
              )
            `)
            .eq('product_id', item.id);

          if (error) {
            console.error('Error fetching product ingredients:', error);
            continue;
          }

          // Update stock quantities
          for (const ingredient of productIngredients || []) {
            const totalNeeded = ingredient.quantity_needed * item.quantity;
            
            await supabase
              .from('stock')
              .update({
                current_quantity: Math.max(0, ingredient.stock.current_quantity - totalNeeded)
              })
              .eq('id', ingredient.stock.id);
          }
        } catch (error) {
          console.error(`Error updating stock for product ${item.name}:`, error);
          // Continue with other items even if one fails
        }
      }
    }
  };

  return {
    processing,
    processCompleteOrder
  };
};