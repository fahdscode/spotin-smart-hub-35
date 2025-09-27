import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentItem {
  item_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PaymentData {
  userId: string;
  items: PaymentItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  transactionType: 'order' | 'membership' | 'day_use_ticket';
}

export const usePaymentProcessing = () => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const generateReceiptNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RCP-${timestamp}-${random.toString().padStart(3, '0')}`;
  };

  const processPayment = async (paymentData: PaymentData) => {
    try {
      setProcessing(true);

      const receiptNumber = generateReceiptNumber();
      
      // Create receipt record
      const receiptData = {
        user_id: paymentData.userId,
        receipt_number: receiptNumber,
        amount: paymentData.subtotal,
        total_amount: paymentData.total,
        payment_method: paymentData.paymentMethod || 'cash',
        transaction_type: paymentData.transactionType,
        line_items: paymentData.items as any
      };

      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert(receiptData)
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Update order items status to 'completed' if this is an order payment
      if (paymentData.transactionType === 'order') {
        const itemNames = paymentData.items.map(item => item.item_name);
        
        const { error: updateError } = await supabase
          .from('session_line_items')
          .update({ status: 'completed' })
          .eq('user_id', paymentData.userId)
          .in('item_name', itemNames)
          .eq('status', 'pending');

        if (updateError) throw updateError;
      }

      toast({
        title: "Payment Successful",
        description: `Payment processed successfully. Receipt #${receiptNumber}`,
      });

      return {
        success: true,
        receipt,
        receiptNumber
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const calculateTotal = (items: PaymentItem[], discountPercentage: number = 0) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = subtotal * (discountPercentage / 100);
    const total = subtotal - discount;

    return {
      subtotal,
      discount,
      total
    };
  };

  const formatReceiptData = (items: PaymentItem[], paymentMethod: string, totals: { subtotal: number; discount: number; total: number }) => {
    return {
      receiptNumber: generateReceiptNumber(),
      customerName: '', // Will be filled by the component
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      paymentMethod,
      items: items.map(item => ({
        name: item.item_name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total
    };
  };

  return {
    processing,
    processPayment,
    calculateTotal,
    formatReceiptData,
    generateReceiptNumber
  };
};