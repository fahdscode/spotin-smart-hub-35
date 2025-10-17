import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, StopCircle, DollarSign, Receipt, Package, Calendar, Users, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";

interface SessionData {
  startTime: string;
  endTime?: string;
  staffName: string;
  staffId: string;
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
  const { toast } = useToast();
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    // Get current staff user
    const getCurrentStaff = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        setCurrentStaff({
          id: user.id,
          name: profile?.full_name || 'Staff Member'
        });
      }
    };

    getCurrentStaff();
    loadSessionData();
  }, []);

  useEffect(() => {
    if (activeSession) {
      // Update income every 30 seconds
      const interval = setInterval(() => {
        updateSessionIncome();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const loadSessionData = () => {
    const savedSession = localStorage.getItem('cashierSession');
    const savedHistory = localStorage.getItem('cashierSessionHistory');

    if (savedSession) {
      setActiveSession(JSON.parse(savedSession));
    }
    if (savedHistory) {
      setSessionHistory(JSON.parse(savedHistory));
    }
  };

  const calculateIncome = async (startTime: string, endTime?: string) => {
    const start = new Date(startTime).toISOString();
    const end = endTime ? new Date(endTime).toISOString() : new Date().toISOString();

    try {
      // Fetch receipts within the session time period
      const { data: receipts, error } = await supabase
        .from('receipts')
        .select('transaction_type, total_amount, line_items')
        .gte('receipt_date', start)
        .lte('receipt_date', end);

      if (error) throw error;

      const income = {
        rooms: 0,
        memberships: 0,
        events: 0,
        items: 0,
        dayUse: 0,
        total: 0
      };

      receipts?.forEach(receipt => {
        const amount = Number(receipt.total_amount) || 0;
        
        switch (receipt.transaction_type) {
          case 'room_booking':
            income.rooms += amount;
            break;
          case 'membership':
            income.memberships += amount;
            break;
          case 'event_registration':
            income.events += amount;
            break;
          case 'day_use_ticket':
            income.dayUse += amount;
            break;
          default:
            income.items += amount;
            break;
        }
        income.total += amount;
      });

      return income;
    } catch (error) {
      console.error('Error calculating income:', error);
      return {
        rooms: 0,
        memberships: 0,
        events: 0,
        items: 0,
        dayUse: 0,
        total: 0
      };
    }
  };

  const updateSessionIncome = async () => {
    if (!activeSession) return;

    const income = await calculateIncome(activeSession.startTime);
    setActiveSession(prev => prev ? { ...prev, income } : null);
  };

  const startSession = async () => {
    if (!currentStaff) {
      toast({
        title: "Error",
        description: "Unable to identify staff member",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const newSession: SessionData = {
      startTime: new Date().toISOString(),
      staffName: currentStaff.name,
      staffId: currentStaff.id,
      income: {
        rooms: 0,
        memberships: 0,
        events: 0,
        items: 0,
        dayUse: 0,
        total: 0
      }
    };

    setActiveSession(newSession);
    localStorage.setItem('cashierSession', JSON.stringify(newSession));

    toast({
      title: "Session Started",
      description: `Shift started by ${currentStaff.name}`,
    });
    setLoading(false);
  };

  const endSession = async () => {
    if (!activeSession) return;

    setLoading(true);
    const endTime = new Date().toISOString();
    const finalIncome = await calculateIncome(activeSession.startTime, endTime);

    const completedSession: SessionData = {
      ...activeSession,
      endTime,
      income: finalIncome
    };

    // Save to history
    const updatedHistory = [completedSession, ...sessionHistory].slice(0, 10); // Keep last 10 sessions
    setSessionHistory(updatedHistory);
    localStorage.setItem('cashierSessionHistory', JSON.stringify(updatedHistory));
    localStorage.removeItem('cashierSession');

    setActiveSession(null);

    toast({
      title: "Session Ended",
      description: `Total collected: ${formatPrice(finalIncome.total)}`,
    });
    setLoading(false);
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Active Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Cashier Session</span>
            {activeSession && (
              <Badge variant="default" className="animate-pulse">Active</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {activeSession 
              ? `Session started by ${activeSession.staffName} at ${new Date(activeSession.startTime).toLocaleTimeString()}`
              : 'Start your shift to begin tracking income'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeSession ? (
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
              {/* Income Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Rooms</span>
                    </div>
                    <p className="text-xl font-bold">{formatPrice(activeSession.income.rooms)}</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Memberships</span>
                    </div>
                    <p className="text-xl font-bold">{formatPrice(activeSession.income.memberships)}</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Events</span>
                    </div>
                    <p className="text-xl font-bold">{formatPrice(activeSession.income.events)}</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Items</span>
                    </div>
                    <p className="text-xl font-bold">{formatPrice(activeSession.income.items)}</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Day Use</span>
                    </div>
                    <p className="text-xl font-bold">{formatPrice(activeSession.income.dayUse)}</p>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">Total</span>
                    </div>
                    <p className="text-xl font-bold text-primary">{formatPrice(activeSession.income.total)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Duration: {formatDuration(activeSession.startTime)}
                </p>
                <Button 
                  onClick={endSession} 
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  <StopCircle className="h-5 w-5 mr-2" />
                  End Session & Handover
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Last 10 completed sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionHistory.map((session, index) => (
                <Card key={index} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{session.staffName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.startTime).toLocaleDateString()} • {formatDuration(session.startTime, session.endTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{formatPrice(session.income.total)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Rooms</p>
                        <p className="font-semibold">{formatPrice(session.income.rooms)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Members</p>
                        <p className="font-semibold">{formatPrice(session.income.memberships)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Events</p>
                        <p className="font-semibold">{formatPrice(session.income.events)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Items</p>
                        <p className="font-semibold">{formatPrice(session.income.items)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Day Use</p>
                        <p className="font-semibold">{formatPrice(session.income.dayUse)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CashierSession;
