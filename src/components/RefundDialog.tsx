import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, RotateCcw, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: {
    id: string;
    receipt_number: string;
    total_amount: number;
    line_items: any[];
    user_id: string;
  } | null;
  onRefundComplete?: () => void;
}

export const RefundDialog = ({ open, onOpenChange, receipt, onRefundComplete }: RefundDialogProps) => {
  const [reason, setReason] = useState('');
  const [restockItems, setRestockItems] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleRefund = async () => {
    if (!receipt) return;
    
    if (!reason.trim()) {
      toast({
        title: "Refund Failed",
        description: "Please provide a reason for the refund",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Update receipt status to cancelled
      const { error: receiptError } = await supabase
        .from('receipts')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id,
          cancellation_reason: reason.trim()
        })
        .eq('id', receipt.id);

      if (receiptError) throw receiptError;

      // 2. If restock option is enabled, restore stock quantities
      if (restockItems && receipt.line_items) {
        for (const item of receipt.line_items) {
          // Get product ingredients
          const { data: productData } = await supabase
            .from('drinks')
            .select('id')
            .eq('name', item.name)
            .maybeSingle();

          if (productData) {
            // Get ingredients for this product
            const { data: ingredients } = await supabase
              .from('product_ingredients')
              .select('stock_id, quantity_needed')
              .eq('product_id', productData.id);

            if (ingredients && ingredients.length > 0) {
              // Restore stock for each ingredient
              for (const ingredient of ingredients) {
                const totalToRestore = ingredient.quantity_needed * item.quantity;
                
                // Get current stock quantity
                const { data: currentStock } = await supabase
                  .from('stock')
                  .select('current_quantity')
                  .eq('id', ingredient.stock_id)
                  .single();

                if (currentStock) {
                  // Update stock with restored quantity
                  await supabase
                    .from('stock')
                    .update({
                      current_quantity: currentStock.current_quantity + totalToRestore,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', ingredient.stock_id);
                }
              }
            }
          }
        }
      }

      // 3. Update related session_line_items to cancelled
      const { error: lineItemsError } = await supabase
        .from('session_line_items')
        .update({ status: 'cancelled' })
        .eq('user_id', receipt.user_id)
        .in('item_name', receipt.line_items.map(item => item.name))
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (lineItemsError) console.error('Error updating line items:', lineItemsError);

      toast({
        title: "Refund Processed",
        description: `Receipt ${receipt.receipt_number} has been refunded successfully${restockItems ? ' and items restocked' : ''}.`,
      });

      setReason('');
      setRestockItems(true);
      onOpenChange(false);
      onRefundComplete?.();

    } catch (error) {
      console.error('Refund error:', error);
      toast({
        title: "Refund Failed",
        description: error instanceof Error ? error.message : "Failed to process refund. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-destructive" />
            Refund Receipt
          </DialogTitle>
          <DialogDescription>
            Process a refund for receipt {receipt?.receipt_number}
          </DialogDescription>
        </DialogHeader>

        {receipt && (
          <div className="space-y-4">
            {/* Receipt Summary */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Receipt #</span>
                <span className="font-mono font-semibold">{receipt.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="font-semibold text-lg">{formatCurrency(receipt.total_amount)}</span>
              </div>
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground mb-1">Items:</p>
                {receipt.line_items?.map((item: any, idx: number) => (
                  <div key={idx} className="text-sm flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Restock Option */}
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="restock"
                checked={restockItems}
                onCheckedChange={(checked) => setRestockItems(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="restock" className="flex items-center gap-2 cursor-pointer">
                  <Package className="h-4 w-4" />
                  Restock items to inventory
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically restore ingredient quantities used in this order
                </p>
              </div>
            </div>

            {/* Refund Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Refund Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for this refund..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                This action will cancel the receipt and cannot be undone. The refund will be recorded in the system.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRefund}
            disabled={processing || !reason.trim()}
          >
            {processing ? 'Processing...' : 'Process Refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
