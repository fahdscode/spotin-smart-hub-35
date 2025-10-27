import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, DollarSign, LogIn, LogOut, Receipt, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/currency';

interface SessionData {
  id: string;
  staffName: string;
  staffId: string;
  startTime: string;
  endTime?: string;
  income: {
    rooms: number;
    memberships: number;
    events: number;
    items: number;
    dayUse: number;
    total: number;
  };
}

const CashierSession = () => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadActiveSession();
  }, []);

  const loadActiveSession = () => {
    const storedSession = localStorage.getItem('cashierSession');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
        // Update income in real-time
        updateSessionIncome(parsed);
      } catch (error) {
        console.error('Error parsing session:', error);
        localStorage.removeItem('cashierSession');
      }
    }
  };

  const updateSessionIncome = async (sessionData: SessionData) => {
    if (!sessionData.startTime) return;

    try {
      const startTime = new Date(sessionData.startTime).toISOString();
      const endTime = sessionData.endTime 
        ? new Date(sessionData.endTime).toISOString() 
        : new Date().toISOString();

      // Fetch receipts within session time
      const { data: receipts, error } = await supabase
        .from('receipts')
        .select('*')
        .gte('receipt_date', startTime)
        .lte('receipt_date', endTime);

      if (error) throw error;

      // Calculate income by category
      const income = {
        rooms: 0,
        memberships: 0,
        events: 0,
        items: 0,
        dayUse: 0,
        total: 0
      };

      receipts?.forEach(receipt => {
        const amount = parseFloat(receipt.total_amount.toString());
        switch (receipt.transaction_type) {
          case 'room_booking':
            income.rooms += amount;
            break;
          case 'membership':
            income.memberships += amount;
            break;
          case 'event':
            income.events += amount;
            break;
          case 'day_use':
            income.dayUse += amount;
            break;
          default:
            income.items += amount;
        }
        income.total += amount;
      });

      const updatedSession = { ...sessionData, income };
      setSession(updatedSession);
      localStorage.setItem('cashierSession', JSON.stringify(updatedSession));
    } catch (error) {
      console.error('Error updating income:', error);
    }
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('admin_users')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const newSession: SessionData = {
        id: `session_${Date.now()}`,
        staffName: profile?.full_name || 'Staff Member',
        staffId: user.id,
        startTime: new Date().toISOString(),
        income: {
          rooms: 0,
          memberships: 0,
          events: 0,
          items: 0,
          dayUse: 0,
          total: 0
        }
      };

      setSession(newSession);
      localStorage.setItem('cashierSession', JSON.stringify(newSession));

      toast({
        title: "Session Started",
        description: "Your cashier shift has begun. Good luck!",
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!session) return;

    setLoading(true);
    try {
      // Update session with end time
      const endedSession = {
        ...session,
        endTime: new Date().toISOString()
      };

      // Final income update
      await updateSessionIncome(endedSession);

      // Clear active session
      localStorage.removeItem('cashierSession');
      
      // Store in session history (for future implementation)
      const history = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
      history.push(endedSession);
      localStorage.setItem('sessionHistory', JSON.stringify(history));

      toast({
        title: "Session Ended",
        description: `Total income: ${formatPrice(endedSession.income.total)}`,
      });

      setSession(null);
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cashier Session
          </CardTitle>
          <CardDescription>
            Start your shift to track daily income and transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Session</h3>
            <p className="text-muted-foreground mb-4">
              Start a cashier session to begin tracking income and transactions
            </p>
            <Button onClick={startSession} disabled={loading} size="lg">
              <LogIn className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
                {session.staffName} • Started {new Date(session.startTime).toLocaleTimeString()}
              </CardDescription>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              {formatDuration(session.startTime)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Income */}
          <div className="bg-primary/10 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Total Income</span>
              </div>
              <div className="text-3xl font-bold text-primary">
                {formatPrice(session.income.total)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Income Breakdown */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Income Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Room Bookings</div>
                <div className="text-xl font-semibold">{formatPrice(session.income.rooms)}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Memberships</div>
                <div className="text-xl font-semibold">{formatPrice(session.income.memberships)}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Events</div>
                <div className="text-xl font-semibold">{formatPrice(session.income.events)}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Items/Orders</div>
                <div className="text-xl font-semibold">{formatPrice(session.income.items)}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Day Use Tickets</div>
                <div className="text-xl font-semibold">{formatPrice(session.income.dayUse)}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              onClick={() => updateSessionIncome(session)} 
              variant="outline" 
              className="flex-1"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Refresh Income
            </Button>
            <Button 
              onClick={endSession} 
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
  );
};

export default CashierSession;