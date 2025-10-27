import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Scan, Clock, User, CheckCircle, XCircle, Loader2, Ticket, Banknote, CreditCard, Building2, Laptop } from 'lucide-react';
import { TicketSelector } from './TicketSelector';
import { formatCurrency } from '@/lib/currency';

interface ScanResult {
  barcode: string;
  userName: string;
  action: 'checked_in' | 'checked_out';
  timestamp: string;
}

interface ReceiptData {
  receiptNumber: string;
  customerName: string;
  customerEmail: string;
  userId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  date: string;
  checkInTime: string;
  duration: number;
  membership?: {
    plan_name: string;
    discount_percentage: number;
  } | null;
  assignedTicket?: {
    name: string;
    price: number;
    ticket_type: string;
  } | null;
}

interface ToggleResult {
  success: boolean;
  error?: string;
  action?: string;
  debug?: any;
  client?: {
    id: string;
    client_code: string;
    full_name: string;
    phone: string;
    email?: string;
    barcode: string;
    active: boolean;
  };
}

interface BarcodeScannerProps {
  scannedByUserId?: string;
}

const BarcodeScanner = ({ scannedByUserId }: BarcodeScannerProps) => {
  const [barcode, setBarcode] = useState('');
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [pendingCheckInClient, setPendingCheckInClient] = useState<{ id: string; name: string } | null>(null);
  const [showCheckoutConfirmation, setShowCheckoutConfirmation] = useState(false);
  const [pendingCheckoutClient, setPendingCheckoutClient] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcode.trim()) {
      handleScanResult();
    }
  };

  const handleScanResult = async () => {
    if (!barcode.trim()) {
      toast({
        title: "Empty Barcode",
        description: "Please scan or enter a barcode.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setDebugInfo(null);

    try {
      console.log('📤 Sending barcode to edge function:', barcode.trim());
      
      const { data, error } = await supabase.functions.invoke('checkin-checkout', {
        body: {
          barcode: barcode.trim(),
          scanned_by_user_id: scannedByUserId || null
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Check-in service error: ${error.message}`);
      }

      console.log('📥 Edge function response:', data);

      const result = data as ToggleResult;

      if (result?.success) {
        const action = result.action as 'checked_in' | 'checked_out';
        
        // If checking in, offer ticket option
        if (action === 'checked_in') {
          setPendingCheckInClient({
            id: result.client!.id,
            name: result.client!.full_name
          });
          setShowTicketDialog(true);
          setBarcode('');
        } else {
          // MANDATORY: Prepare checkout confirmation with receipt details
          const clientId = result.client!.id;
          setPendingCheckoutClient(clientId);
          await prepareCheckoutReceipt(clientId, result.client!.full_name, result.client!.email);
          setBarcode('');
        }
        
        setDebugInfo(result.debug);
      } else {
        console.error('❌ Scan failed:', result?.error);
        setDebugInfo(result?.debug || null);
        
        toast({
          title: "Scan Failed",
          description: result?.error || "Invalid barcode or client not found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Error processing barcode scan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Check-in Error",
        description: errorMessage.includes('Database error') 
          ? "Database connection issue. Please try again in a moment."
          : "Failed to process barcode scan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      inputRef.current?.focus();
    }
  };

  const prepareCheckoutReceipt = async (clientId: string, clientName: string, clientEmail?: string) => {
    try {
      // Get current check-in session time
      const { data: checkInData } = await supabase
        .from('check_ins')
        .select('checked_in_at')
        .eq('client_id', clientId)
        .eq('status', 'checked_in')
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const checkInTime = checkInData?.checked_in_at;

      // Determine the time range for orders
      let startTime: string;
      if (checkInTime) {
        startTime = checkInTime;
      } else {
        const { data: clientData } = await supabase
          .from('clients')
          .select('updated_at')
          .eq('id', clientId)
          .single();
        
        startTime = clientData?.updated_at || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      }

      // Check if client has an active membership
      const { data: membership } = await supabase
        .from('client_memberships')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle();

      // Fetch all completed/served orders in the session time range
      const { data: orders } = await supabase
        .from('session_line_items')
        .select('*')
        .eq('user_id', clientId)
        .in('status', ['completed', 'served', 'ready'])
        .gte('created_at', startTime)
        .lte('created_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      let receiptItems: any[] = orders?.map(order => ({
        name: order.item_name,
        quantity: order.quantity,
        price: order.price,
        total: order.price * order.quantity
      })) || [];

      const duration = checkInTime 
        ? Math.round((new Date().getTime() - new Date(checkInTime).getTime()) / 60000) 
        : 0;

      // Check for assigned ticket in this session
      const ticketLookbackTime = new Date(new Date(startTime).getTime() - 10000).toISOString();
      const { data: assignedTicket } = await supabase
        .from('client_tickets')
        .select(`
          *,
          ticket:drinks!client_tickets_ticket_id_fkey(name, price, ticket_type)
        `)
        .eq('client_id', clientId)
        .eq('is_active', true)
        .gte('purchase_date', ticketLookbackTime)
        .order('purchase_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // If no membership, add the assigned ticket
      if (!membership) {
        if (assignedTicket?.ticket) {
          receiptItems = [
            {
              name: assignedTicket.ticket.name,
              quantity: 1,
              price: assignedTicket.ticket.price,
              total: assignedTicket.ticket.price
            },
            ...receiptItems
          ];
        } else {
          // Fallback: fetch default day use ticket
          const { data: ticketData } = await supabase
            .from('drinks')
            .select('name, price')
            .eq('category', 'day_use_ticket')
            .eq('is_available', true)
            .limit(1)
            .maybeSingle();

          if (ticketData) {
            receiptItems = [
              {
                name: ticketData.name,
                quantity: 1,
                price: ticketData.price,
                total: ticketData.price
              },
              ...receiptItems
            ];
          }
        }
      }

      // Calculate total
      const orderTotal = receiptItems.reduce((sum, item) => sum + item.total, 0);
      
      // Prepare receipt data
      setReceiptData({
        receiptNumber: `RCP-${Date.now()}`,
        customerName: clientName,
        customerEmail: clientEmail || '',
        userId: clientId,
        items: receiptItems,
        subtotal: orderTotal,
        discount: 0,
        total: orderTotal,
        paymentMethod: 'cash',
        date: new Date().toLocaleDateString(),
        checkInTime: checkInTime ? new Date(checkInTime).toLocaleTimeString() : '',
        duration: duration,
        membership: membership ? {
          plan_name: membership.plan_name,
          discount_percentage: membership.discount_percentage
        } : null,
        assignedTicket: assignedTicket?.ticket ? {
          name: assignedTicket.ticket.name,
          price: assignedTicket.ticket.price,
          ticket_type: assignedTicket.ticket.ticket_type
        } : null
      });

      // Reset payment method selection
      setSelectedPaymentMethod("");
      
      // Show confirmation dialog
      setShowCheckoutConfirmation(true);
    } catch (error) {
      console.error('Error preparing checkout receipt:', error);
      toast({
        title: "Error",
        description: "Failed to prepare checkout details",
        variant: "destructive"
      });
    }
  };

  const confirmCheckout = async () => {
    if (!pendingCheckoutClient || !receiptData) return;

    if (!selectedPaymentMethod) {
      toast({
        title: "Payment Required",
        description: "Please select a payment method",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create receipt if there are items
      if (receiptData.items.length > 0 || receiptData.total > 0) {
        const { error: receiptError } = await supabase
          .from('receipts')
          .insert({
            receipt_number: receiptData.receiptNumber,
            user_id: receiptData.userId,
            total_amount: receiptData.total,
            amount: receiptData.total,
            payment_method: selectedPaymentMethod,
            transaction_type: 'checkout',
            line_items: receiptData.items,
            status: 'completed'
          });

        if (receiptError) throw receiptError;
      }

      // Checkout the client
      const { error } = await supabase
        .from('clients')
        .update({ active: false })
        .eq('id', pendingCheckoutClient);

      if (error) throw error;

      const scanResult: ScanResult = {
        barcode: '',
        userName: receiptData.customerName,
        action: 'checked_out',
        timestamp: new Date().toISOString()
      };

      setLatestScan(scanResult);
      setRecentScans(prev => [scanResult, ...prev].slice(0, 5));
      
      setShowCheckoutConfirmation(false);
      setPendingCheckoutClient(null);
      
      toast({
        title: "Checkout Complete",
        description: `${receiptData.customerName} has been checked out successfully`,
      });
      
      // Emit event to refresh active sessions
      window.dispatchEvent(new CustomEvent('client-status-changed'));
    } catch (error) {
      console.error('Error checking out client:', error);
      toast({
        title: "Checkout Error",
        description: "Failed to complete checkout",
        variant: "destructive"
      });
    }
  };

  const handleTicketAssigned = (ticketData: any) => {
    setShowTicketDialog(false);
    
    if (pendingCheckInClient) {
      toast({
        title: "Check-in Complete",
        description: `${pendingCheckInClient.name} checked in with ${ticketData.ticket_name}`,
      });

      const scanResult: ScanResult = {
        barcode: '',
        userName: pendingCheckInClient.name,
        action: 'checked_in',
        timestamp: new Date().toISOString()
      };

      setLatestScan(scanResult);
      setRecentScans(prev => [scanResult, ...prev].slice(0, 5));
      
      // Emit event to refresh active sessions
      window.dispatchEvent(new CustomEvent('client-status-changed'));
    }
    
    setPendingCheckInClient(null);
  };

  const handleSkipTicket = () => {
    setShowTicketDialog(false);
    
    if (pendingCheckInClient) {
      toast({
        title: "Client Checked In",
        description: `${pendingCheckInClient.name} has been checked in successfully.`,
      });

      const scanResult: ScanResult = {
        barcode: '',
        userName: pendingCheckInClient.name,
        action: 'checked_in',
        timestamp: new Date().toISOString()
      };

      setLatestScan(scanResult);
      setRecentScans(prev => [scanResult, ...prev].slice(0, 5));
      
      // Emit event to refresh active sessions
      window.dispatchEvent(new CustomEvent('client-status-changed'));
    }
    
    setPendingCheckInClient(null);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <>
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Assign Ticket
            </DialogTitle>
            <DialogDescription>
              Choose a ticket type for the client or skip to check in without a ticket
            </DialogDescription>
          </DialogHeader>
          {pendingCheckInClient && (
            <TicketSelector
              clientId={pendingCheckInClient.id}
              clientName={pendingCheckInClient.name}
              onTicketAssigned={handleTicketAssigned}
              onCancel={handleSkipTicket}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCheckoutConfirmation} onOpenChange={setShowCheckoutConfirmation}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Checkout Confirmation</DialogTitle>
            <DialogDescription>
              Review the checkout details and select payment method
            </DialogDescription>
          </DialogHeader>
          {receiptData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{receiptData.customerName}</span>
                </div>
                {receiptData.checkInTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Check-in Time:</span>
                    <span>{receiptData.checkInTime}</span>
                  </div>
                )}
                {receiptData.duration > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{receiptData.duration} minutes</span>
                  </div>
                )}
              </div>

              {receiptData.items.length > 0 && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Items</h4>
                  {receiptData.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-medium">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(receiptData.total)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Cash
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Card
                      </div>
                    </SelectItem>
                    <SelectItem value="bank_transfer">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Bank Transfer
                      </div>
                    </SelectItem>
                    <SelectItem value="digital_wallet">
                      <div className="flex items-center gap-2">
                        <Laptop className="h-4 w-4" />
                        Digital Wallet
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCheckoutConfirmation(false);
                    setPendingCheckoutClient(null);
                    setReceiptData(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmCheckout}
                  disabled={!selectedPaymentMethod}
                  className="flex-1"
                >
                  Confirm Checkout
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Quick Scanner
            </CardTitle>
            <CardDescription>
              Scan client barcode for instant check-in/out
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Scan or type barcode..."
                value={barcode}
                onChange={handleBarcodeInput}
                onKeyPress={handleKeyPress}
                disabled={processing}
                className="flex-1"
              />
              <Button 
                onClick={handleScanResult} 
                disabled={!barcode.trim() || processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Process'
                )}
              </Button>
            </div>

            {barcode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBarcode('');
                  inputRef.current?.focus();
                }}
                className="w-full"
              >
                Clear
              </Button>
            )}

            {debugInfo && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs font-mono">
                  Debug: {JSON.stringify(debugInfo, null, 2)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {latestScan && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Latest Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {latestScan.action === 'checked_in' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-orange-600" />
                  )}
                  <div>
                    <p className="font-semibold">{latestScan.userName}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {latestScan.action.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(latestScan.timestamp)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {recentScans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentScans.map((scan, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{scan.userName}</span>
                      <Badge
                        variant={scan.action === 'checked_in' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {scan.action.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(scan.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default BarcodeScanner;
