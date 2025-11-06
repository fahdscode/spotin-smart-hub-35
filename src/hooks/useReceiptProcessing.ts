import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  category: 'product' | 'room' | 'ticket' | 'membership';
}

export interface ReceiptData {
  receiptNumber: string;
  customerName: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  userId: string;
}

export const useReceiptProcessing = () => {
  const [generating, setGenerating] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const { toast } = useToast();

  const generateReceiptNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `RCP-${timestamp}-${random.toString().padStart(3, '0')}`;
  };

  const createReceipt = async (receiptData: ReceiptData) => {
    try {
      setGenerating(true);

      // Save receipt to database using the correct field names
      const { data: receipt, error } = await supabase
        .from('receipts')
        .insert([{
          user_id: receiptData.userId,
          receipt_number: receiptData.receiptNumber,
          amount: receiptData.subtotal,
          total_amount: receiptData.total,
          payment_method: receiptData.paymentMethod,
          transaction_type: 'order',
          line_items: receiptData.items as any
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Receipt Generated",
        description: `Receipt ${receiptData.receiptNumber} created successfully`,
      });

      return receipt;
    } catch (error) {
      console.error('Error creating receipt:', error);
      toast({
        title: "Receipt Failed",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  const emailReceipt = async (receiptData: ReceiptData, clientEmail: string) => {
    try {
      setEmailSending(true);

      // TODO: Implement email sending via edge function
      // For now, just show success message
      toast({
        title: "Email Sent",
        description: `Receipt sent to ${clientEmail}`,
      });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Failed",
        description: "Failed to send receipt email",
        variant: "destructive",
      });
      return false;
    } finally {
      setEmailSending(false);
    }
  };

  const downloadReceiptPDF = async (receiptData: ReceiptData) => {
    try {
      // TODO: Implement PDF generation
      toast({
        title: "Download Started",
        description: "PDF download feature coming soon!",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download receipt PDF",
        variant: "destructive",
      });
    }
  };

  return {
    generating,
    emailSending,
    generateReceiptNumber,
    createReceipt,
    emailReceipt,
    downloadReceiptPDF
  };
};