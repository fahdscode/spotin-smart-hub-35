import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/currency";

export const CashierSession = () => {
  const { toast } = useToast();
  const [activeSession, setActiveSession] = useState<{ start_time: string } | null>(null);
  const [sessionIncome, setSessionIncome] = useState({
    rooms: 0,
    memberships: 0,
    events: 0,
    items: 0,
    day_use: 0,
    total: 0
  });

  useEffect(() => {
    const savedSession = localStorage.getItem('active_cashier_session');
    if (savedSession) {
      setActiveSession(JSON.parse(savedSession));
    }
  }, []);

  useEffect(() => {
    if (activeSession) {
      calculateSessionIncome();
      
      const subscription = supabase
        .channel('session-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'receipts'
        }, () => {
          calculateSessionIncome();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [activeSession]);

  const calculateSessionIncome = async () => {
    if (!activeSession) return;

    const { data: receipts } = await supabase
      .from('receipts')
      .select('transaction_type, total_amount')
      .gte('receipt_date', activeSession.start_time);

    if (receipts) {
      const income = receipts.reduce((acc, receipt) => {
        const amount = Number(receipt.total_amount) || 0;
        switch (receipt.transaction_type) {
          case 'room_booking':
            acc.rooms += amount;
            break;
          case 'membership':
            acc.memberships += amount;
            break;
          case 'event_registration':
            acc.events += amount;
            break;
          case 'day_use_ticket':
            acc.day_use += amount;
            break;
          default:
            acc.items += amount;
        }
        acc.total += amount;
        return acc;
      }, { rooms: 0, memberships: 0, events: 0, items: 0, day_use: 0, total: 0 });

      setSessionIncome(income);
    }
  };

  const startSession = () => {
    const session = { start_time: new Date().toISOString() };
    setActiveSession(session);
    localStorage.setItem('active_cashier_session', JSON.stringify(session));
    toast({
      title: "Session Started",
      description: "Cashier session is now active"
    });
  };

  const endSession = () => {
    if (!activeSession) return;

    toast({
      title: "Session Ended",
      description: `Total income: ${formatPrice(sessionIncome.total)}`,
      duration: 5000
    });
    
    localStorage.removeItem('active_cashier_session');
    setActiveSession(null);
    setSessionIncome({ rooms: 0, memberships: 0, events: 0, items: 0, day_use: 0, total: 0 });
  };

  return (
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
          {activeSession ? (
            <Badge variant="default" className="gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Session Active
            </Badge>
          ) : (
            <Badge variant="secondary">No Active Session</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activeSession ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Started: {new Date(activeSession.start_time).toLocaleString()}
              </div>
              <Button 
                onClick={endSession} 
                variant="destructive"
                size="sm"
              >
                <Square className="mr-2 h-4 w-4" />
                End Session
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{formatPrice(sessionIncome.rooms)}</div>
                  <div className="text-xs text-muted-foreground">Rooms</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{formatPrice(sessionIncome.memberships)}</div>
                  <div className="text-xs text-muted-foreground">Memberships</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{formatPrice(sessionIncome.events)}</div>
                  <div className="text-xs text-muted-foreground">Events</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{formatPrice(sessionIncome.items)}</div>
                  <div className="text-xs text-muted-foreground">Items</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{formatPrice(sessionIncome.day_use)}</div>
                  <div className="text-xs text-muted-foreground">Day Use</div>
                </CardContent>
              </Card>
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{formatPrice(sessionIncome.total)}</div>
                  <div className="text-xs opacity-90">Total</div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Button 
            onClick={startSession} 
            className="w-full"
          >
            <Play className="mr-2 h-4 w-4" />
            Start New Session
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
