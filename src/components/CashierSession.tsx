import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, DollarSign, LogIn, LogOut, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';

interface CashierSessionData {
  id: string;
  staff_id: string;
  staff_name: string;
  start_time: string;
  end_time?: string;
  opening_cash: number;
  closing_cash?: number;
  expected_cash?: number;
  cash_difference?: number;
  total_sales: number;
  cash_sales: number;
  card_sales: number;
  bank_transfer_sales: number;
  hot_desk_sales: number;
  notes?: string;
  is_active: boolean;
}

const CashierSession = () => {
  const [session, setSession] = useState<CashierSessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadActiveSession();
  }, []);

  const loadActiveSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('cashier_sessions')
        .select('*')
        .eq('staff_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setSession(data);
        await updateSessionSales(data);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const updateSessionSales = async (sessionData: CashierSessionData) => {
    try {
      const startTime = sessionData.start_time;
      const endTime = sessionData.end_time || new Date().toISOString();

      // Fetch all receipts in this session
      const { data: receipts } = await supabase
        .from('receipts')
        .select('total_amount, payment_method')
        .gte('receipt_date', startTime)
        .lte('receipt_date', endTime);

      let totalSales = 0;
      let cashSales = 0;
      let cardSales = 0;
      let bankTransferSales = 0;
      let hotDeskSales = 0;

      receipts?.forEach(receipt => {
        const amount = parseFloat(receipt.total_amount.toString());
        totalSales += amount;
        
        const paymentMethod = receipt.payment_method?.toLowerCase();
        if (paymentMethod === 'cash') {
          cashSales += amount;
        } else if (paymentMethod === 'visa') {
          cardSales += amount;
        } else if (paymentMethod === 'bank_transfer') {
          bankTransferSales += amount;
        } else if (paymentMethod === 'hot_desk') {
          hotDeskSales += amount;
        }
      });

      // Update session in database
      await supabase
        .from('cashier_sessions')
        .update({
          total_sales: totalSales,
          cash_sales: cashSales,
          card_sales: cardSales,
          bank_transfer_sales: bankTransferSales,
          hot_desk_sales: hotDeskSales,
          expected_cash: sessionData.opening_cash + cashSales
        })
        .eq('id', sessionData.id);

      // Update local state
      setSession(prev => prev ? {
        ...prev,
        total_sales: totalSales,
        cash_sales: cashSales,
        card_sales: cardSales,
        bank_transfer_sales: bankTransferSales,
        hot_desk_sales: hotDeskSales,
        expected_cash: sessionData.opening_cash + cashSales
      } : null);
    } catch (error) {
      console.error('Error updating sales:', error);
    }
  };

  const startSession = async () => {
    const openingAmount = parseFloat(openingCash);
    if (isNaN(openingAmount) || openingAmount < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid opening cash amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('admin_users')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const { data: newSession, error } = await supabase
        .from('cashier_sessions')
        .insert({
          staff_id: user.id,
          staff_name: profile?.full_name || 'Staff Member',
          opening_cash: openingAmount,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setSession(newSession);
      setShowStartDialog(false);
      setOpeningCash('');

      toast({
        title: "Session Started",
        description: `Opening cash: ${formatCurrency(openingAmount)}`,
      });
      
      // Notify dashboard about session change
      window.dispatchEvent(new Event('cashier-session-changed'));
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!session) return;

    const closingAmount = parseFloat(closingCash);
    if (isNaN(closingAmount) || closingAmount < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid closing cash amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const expectedCash = session.opening_cash + (session.cash_sales || 0);
      const difference = closingAmount - expectedCash;

      await supabase
        .from('cashier_sessions')
        .update({
          end_time: new Date().toISOString(),
          closing_cash: closingAmount,
          cash_difference: difference,
          notes: notes,
          is_active: false
        })
        .eq('id', session.id);

      toast({
        title: "Session Ended",
        description: `Cash difference: ${formatCurrency(Math.abs(difference))} ${difference >= 0 ? 'over' : 'short'}`,
      });

      setSession(null);
      setShowEndDialog(false);
      setClosingCash('');
      setNotes('');
      
      // Notify dashboard about session change
      window.dispatchEvent(new Event('cashier-session-changed'));
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!session) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cashier Session
            </CardTitle>
            <CardDescription>
              Start your shift with opening cash balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Session</h3>
              <p className="text-muted-foreground mb-4">
                Start a cashier session with your opening cash amount
              </p>
              <Button onClick={() => setShowStartDialog(true)} disabled={loading} size="lg">
                <LogIn className="h-4 w-4 mr-2" />
                Start Session
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Cashier Session</DialogTitle>
              <DialogDescription>
                Enter the opening cash amount in the register
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="opening-cash">Opening Cash Amount</Label>
                <Input
                  id="opening-cash"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStartDialog(false)}>
                Cancel
              </Button>
              <Button onClick={startSession} disabled={loading}>
                Start Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Active Cashier Session
                </CardTitle>
                <CardDescription>
                  {session.staff_name} • Started {new Date(session.start_time).toLocaleTimeString()}
                </CardDescription>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                <Clock className="h-4 w-4 mr-2" />
                {formatDuration(session.start_time)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cash Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Opening Cash</div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(session.opening_cash)}
                </div>
              </div>
              <div className="bg-green-500/10 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Expected Cash</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(session.expected_cash || session.opening_cash)}
                </div>
              </div>
              <div className="bg-blue-500/10 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Sales</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(session.total_sales)}
                </div>
              </div>
            </div>

            <Separator />

            {/* Sales Breakdown */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Sales Breakdown by Payment Method
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Cash Sales</div>
                  <div className="text-xl font-semibold">{formatCurrency(session.cash_sales)}</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Visa Sales</div>
                  <div className="text-xl font-semibold">{formatCurrency(session.card_sales)}</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Bank Transfer</div>
                  <div className="text-xl font-semibold">{formatCurrency(session.bank_transfer_sales)}</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Hot Desk</div>
                  <div className="text-xl font-semibold">{formatCurrency(session.hot_desk_sales)}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-4">
              <Button 
                onClick={() => updateSessionSales(session)} 
                variant="outline" 
                className="flex-1"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Refresh Sales
              </Button>
              <Button 
                onClick={() => setShowEndDialog(true)} 
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                <LogOut className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Cashier Session</DialogTitle>
            <DialogDescription>
              Count the cash and enter the closing amount
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Expected Cash</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(session.expected_cash || session.opening_cash)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Sales</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(session.total_sales)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closing-cash">Closing Cash Amount</Label>
              <Input
                id="closing-cash"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any discrepancies or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button onClick={endSession} disabled={loading}>
              End Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CashierSession;