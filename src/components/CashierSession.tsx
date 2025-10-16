import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlayCircle, StopCircle, DollarSign, TrendingUp, Calendar, Users, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';

interface SessionIncome {
  rooms: number;
  memberships: number;
  events: number;
  items: number;
  day_use: number;
  total: number;
}

interface CashierSessionData {
  id: string;
  started_at: string;
  ended_at: string | null;
  started_by: string;
  income: SessionIncome;
  is_active: boolean;
}

const CashierSession = () => {
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<CashierSessionData | null>(null);
  const [sessionHistory, setSessionHistory] = useState<CashierSessionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [income, setIncome] = useState<SessionIncome>({
    rooms: 0,
    memberships: 0,
    events: 0,
    items: 0,
    day_use: 0,
    total: 0
  });

  useEffect(() => {
    fetchCurrentSession();
    fetchSessionHistory();
  }, []);

  useEffect(() => {
    if (currentSession?.is_active) {
      const interval = setInterval(() => {
        fetchSessionIncome();
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [currentSession]);

  const fetchCurrentSession = async () => {
    try {
      const { data, error } = await supabase
        .from('cashier_sessions')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setCurrentSession(data);
      if (data) {
        setIncome(data.income);
      }
    } catch (error) {
      console.error('Error fetching current session:', error);
    }
  };

  const fetchSessionHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('cashier_sessions')
        .select('*')
        .eq('is_active', false)
        .order('ended_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessionHistory(data || []);
    } catch (error) {
      console.error('Error fetching session history:', error);
    }
  };

  const fetchSessionIncome = async () => {
    if (!currentSession) return;

    try {
      const startDate = new Date(currentSession.started_at);

      // Fetch rooms income
      const { data: roomsData } = await supabase
        .from('receipts')
        .select('total_amount')
        .eq('transaction_type', 'room_booking')
        .gte('receipt_date', startDate.toISOString());

      const roomsIncome = roomsData?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;

      // Fetch memberships income
      const { data: membershipsData } = await supabase
        .from('receipts')
        .select('total_amount')
        .eq('transaction_type', 'membership')
        .gte('receipt_date', startDate.toISOString());

      const membershipsIncome = membershipsData?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;

      // Fetch events income
      const { data: eventsData } = await supabase
        .from('receipts')
        .select('total_amount')
        .eq('transaction_type', 'event_registration')
        .gte('receipt_date', startDate.toISOString());

      const eventsIncome = eventsData?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;

      // Fetch items income
      const { data: itemsData } = await supabase
        .from('receipts')
        .select('total_amount')
        .eq('transaction_type', 'sale')
        .gte('receipt_date', startDate.toISOString());

      const itemsIncome = itemsData?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;

      // Fetch day use tickets income
      const { data: dayUseData } = await supabase
        .from('receipts')
        .select('total_amount')
        .eq('transaction_type', 'day_use_ticket')
        .gte('receipt_date', startDate.toISOString());

      const dayUseIncome = dayUseData?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;

      const newIncome = {
        rooms: roomsIncome,
        memberships: membershipsIncome,
        events: eventsIncome,
        items: itemsIncome,
        day_use: dayUseIncome,
        total: roomsIncome + membershipsIncome + eventsIncome + itemsIncome + dayUseIncome
      };

      setIncome(newIncome);

      // Update session in database
      await supabase
        .from('cashier_sessions')
        .update({ income: newIncome })
        .eq('id', currentSession.id);

    } catch (error) {
      console.error('Error fetching session income:', error);
    }
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cashier_sessions')
        .insert({
          started_by: user.id,
          is_active: true,
          income: {
            rooms: 0,
            memberships: 0,
            events: 0,
            items: 0,
            day_use: 0,
            total: 0
          }
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data);
      setIncome(data.income);

      toast({
        title: "Session Started",
        description: "Cashier session is now active",
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!currentSession) return;

    setLoading(true);
    try {
      await fetchSessionIncome(); // Final update

      const { error } = await supabase
        .from('cashier_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      toast({
        title: "Session Ended",
        description: `Total income: ${formatCurrency(income.total)}`,
      });

      setCurrentSession(null);
      setIncome({
        rooms: 0,
        memberships: 0,
        events: 0,
        items: 0,
        day_use: 0,
        total: 0
      });
      fetchSessionHistory();
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const hours = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor(((endTime.getTime() - startTime.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Current Session */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cashier Session
              </CardTitle>
              <CardDescription>Track daily income by category</CardDescription>
            </div>
            {currentSession?.is_active ? (
              <Badge variant="default" className="bg-success">Active Session</Badge>
            ) : (
              <Badge variant="outline">No Active Session</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentSession?.is_active ? (
            <Button 
              onClick={startSession} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              Start Session
            </Button>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Rooms</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(income.rooms)}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Memberships</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(income.memberships)}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Events</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(income.events)}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Items</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(income.items)}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Ticket className="h-4 w-4" />
                    <span className="text-sm">Day Use</span>
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(income.day_use)}</div>
                </div>
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="text-sm text-muted-foreground mb-1">Total Income</div>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(income.total)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Duration: {formatDuration(currentSession.started_at, null)}</span>
                <span>Started: {new Date(currentSession.started_at).toLocaleString()}</span>
              </div>

              <Button 
                onClick={endSession} 
                disabled={loading}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <StopCircle className="h-5 w-5 mr-2" />
                End Session
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>Previous cashier sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Rooms</TableHead>
                  <TableHead className="text-right">Memberships</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Day Use</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionHistory.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {new Date(session.started_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {formatDuration(session.started_at, session.ended_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(session.income.rooms)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(session.income.memberships)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(session.income.events)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(session.income.items)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(session.income.day_use)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(session.income.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CashierSession;
