import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Ban, Eye, Calendar, User, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface CancelledReceipt {
  id: string;
  receipt_number: string;
  user_id: string;
  total_amount: number;
  payment_method: string;
  cancelled_at: string;
  cancelled_by: string;
  cancellation_reason: string;
  receipt_date: string;
  line_items: any[];
}

const CancelledReceipts = () => {
  const [receipts, setReceipts] = useState<CancelledReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<CancelledReceipt | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [staffNames, setStaffNames] = useState<{ [key: string]: string }>({});
  const [clientNames, setClientNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchCancelledReceipts();
  }, []);

  const fetchCancelledReceipts = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching cancelled receipts...');
      
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('status', 'cancelled')
        .order('cancelled_at', { ascending: false });

      console.log('📊 Cancelled receipts query result:', { data, error });

      if (error) {
        console.error('❌ Error fetching cancelled receipts:', error);
        throw error;
      }

      const cancelledReceipts = data || [];
      console.log(`✅ Found ${cancelledReceipts.length} cancelled receipts`);
      setReceipts(cancelledReceipts as any);

      // Fetch staff names
      const staffIds = [...new Set(cancelledReceipts.map(r => r.cancelled_by).filter(Boolean))];
      console.log('👥 Staff IDs to fetch:', staffIds);
      
      if (staffIds.length > 0) {
        const { data: staffData, error: staffError } = await supabase
          .from('admin_users')
          .select('user_id, full_name')
          .in('user_id', staffIds);

        console.log('👨‍💼 Staff data fetched:', { staffData, staffError });

        const staffMap: { [key: string]: string } = {};
        staffData?.forEach(staff => {
          staffMap[staff.user_id] = staff.full_name;
        });
        setStaffNames(staffMap);
      }

      // Fetch client names
      const clientIds = [...new Set(cancelledReceipts.map(r => r.user_id).filter(Boolean))];
      console.log('👤 Client IDs to fetch:', clientIds);
      
      if (clientIds.length > 0) {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, full_name')
          .in('id', clientIds);

        console.log('👨‍👩‍👧‍👦 Client data fetched:', { clientData, clientError });

        const clientMap: { [key: string]: string } = {};
        clientData?.forEach(client => {
          clientMap[client.id] = client.full_name;
        });
        setClientNames(clientMap);
      }
    } catch (error) {
      console.error('💥 Error in fetchCancelledReceipts:', error);
      toast.error('Failed to load cancelled receipts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (receipt: CancelledReceipt) => {
    setSelectedReceipt(receipt);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Cancelled Receipts
          </CardTitle>
          <CardDescription>Track all cancelled transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Cancelled Receipts
              </CardTitle>
              <CardDescription>Track all cancelled transactions</CardDescription>
            </div>
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {receipts.length} Cancelled
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ban className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cancelled receipts found</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Cancelled By</TableHead>
                    <TableHead>Cancelled At</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map(receipt => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-mono text-sm">
                        {receipt.receipt_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{clientNames[receipt.user_id] || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {formatCurrency(receipt.total_amount)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {staffNames[receipt.cancelled_by] || 'System'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(receipt.cancelled_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {receipt.cancellation_reason}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(receipt)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cancelled Receipt Details</DialogTitle>
            <DialogDescription>
              Complete information about the cancelled transaction
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-6">
              {/* Receipt Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Receipt Number</p>
                  <p className="font-mono font-semibold">{selectedReceipt.receipt_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg">{formatCurrency(selectedReceipt.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{clientNames[selectedReceipt.user_id] || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <Badge variant="outline">{selectedReceipt.payment_method}</Badge>
                </div>
              </div>

              {/* Cancellation Info */}
              <div className="border-l-4 border-destructive p-4 bg-destructive/5 rounded">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Ban className="h-4 w-4" />
                  Cancellation Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cancelled by: </span>
                    <span className="font-medium">{staffNames[selectedReceipt.cancelled_by] || 'System'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cancelled at: </span>
                    <span className="font-medium">{new Date(selectedReceipt.cancelled_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reason: </span>
                    <p className="mt-1 p-2 bg-background rounded border">
                      {selectedReceipt.cancellation_reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="font-semibold mb-3">Items</h4>
                <div className="border rounded-lg divide-y">
                  {selectedReceipt.line_items?.map((item: any, index: number) => (
                    <div key={index} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.total)}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CancelledReceipts;
