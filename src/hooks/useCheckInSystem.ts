import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CheckInResult {
  success: boolean;
  action: 'checked_in' | 'checked_out';
  client: {
    id: string;
    client_code: string;
    full_name: string;
    phone: string;
    email?: string;
    barcode: string;
    active: boolean;
  };
  debug?: any;
}

export const useCheckInSystem = () => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const processBarcodeScan = useCallback(async (barcode: string, scannedByUserId?: string): Promise<CheckInResult | null> => {
    try {
      setProcessing(true);
      
      // Use edge function for reliable check-in/out operations
      const { data, error } = await supabase.functions.invoke('checkin-checkout', {
        body: {
          barcode: barcode.trim(),
          scanned_by_user_id: scannedByUserId || null
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Check-in service error: ${error.message}`);
      }

      const result = data as any;
      if (result?.success) {
        const action = result.action as 'checked_in' | 'checked_out';
        
        toast({
          title: `Client ${action === 'checked_in' ? 'Checked In' : 'Checked Out'}`,
          description: `${result.client.full_name} has been ${action.replace('_', ' ')} successfully.`,
          variant: "default",
        });

        return {
          success: true,
          action,
          client: result.client
        };
      } else {
        toast({
          title: "Scan Failed",
          description: result?.error || "Invalid barcode or client not found.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error('Error processing barcode scan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Check-in Error",
        description: errorMessage.includes('Database error') 
          ? "Database connection issue. Please try again in a moment."
          : "Failed to process barcode scan. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setProcessing(false);
    }
  }, [toast]);

  const manualCheckOut = useCallback(async (clientId: string, checkedOutByUserId?: string): Promise<boolean> => {
    try {
      setProcessing(true);
      
      // Use edge function for reliable checkout operations
      const { data, error } = await supabase.functions.invoke('checkin-checkout', {
        body: {
          action: 'checkout',
          client_id: clientId,
          scanned_by_user_id: checkedOutByUserId || null
        }
      });

      if (error) {
        console.error('Edge function checkout error:', error);
        throw new Error(`Checkout service error: ${error.message}`);
      }

      const result = data as any;
      if (result?.success) {
        toast({
          title: "Client Checked Out",
          description: `${result.client.full_name} has been checked out successfully.`,
        });
        return true;
      } else {
        toast({
          title: "Checkout Failed",
          description: result?.error || "Failed to check out client.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error checking out client:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Checkout Error", 
        description: errorMessage.includes('Checkout failed') 
          ? "Database connection issue. Please try again in a moment."
          : "Failed to check out client. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setProcessing(false);
    }
  }, [toast]);

  const getActiveClients = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_receptionist_active_sessions');
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching active clients:', error);
      return [];
    }
  }, []);

  return {
    processing,
    processBarcodeScan,
    manualCheckOut,
    getActiveClients
  };
};