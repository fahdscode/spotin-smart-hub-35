import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Coffee, Ticket, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { TicketExpiryCountdown } from './TicketExpiryCountdown';

interface ActiveTicketData {
  id: string;
  ticket_name: string;
  ticket_price: number;
  ticket_description: string;
  includes_free_drink: boolean;
  purchase_date: string;
  expiry_date: string;
  checked_in_at: string;
  hours_remaining: number;
}

interface ActiveTicketCardProps {
  clientId: string;
}

export const ActiveTicketCard = ({ clientId }: ActiveTicketCardProps) => {
  const [ticketData, setTicketData] = useState<ActiveTicketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveTicket();

    // Subscribe to ticket changes
    const channel = supabase
      .channel('client-ticket-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_tickets',
          filter: `client_id=eq.${clientId}`
        },
        () => {
          fetchActiveTicket();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const fetchActiveTicket = async () => {
    try {
      const { data, error } = await supabase.rpc('get_client_active_ticket', {
        p_client_id: clientId
      });

      if (error) throw error;

      // Check if data has any properties (not an empty object)
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        const ticketInfo = data as any;
        if (ticketInfo.id) {
          setTicketData(ticketInfo as ActiveTicketData);
        } else {
          setTicketData(null);
        }
      } else {
        setTicketData(null);
      }
    } catch (error) {
      console.error('Error fetching active ticket:', error);
      setTicketData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!ticketData) {
    return null;
  }

  const getUrgencyColor = (): 'default' | 'destructive' | 'secondary' => {
    if (ticketData.hours_remaining < 2) return 'destructive';
    if (ticketData.hours_remaining < 6) return 'secondary';
    return 'default';
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Active Day Pass</CardTitle>
          </div>
          <Badge variant={getUrgencyColor()}>
            {ticketData.hours_remaining < 1 
              ? 'Expiring Soon' 
              : `${Math.floor(ticketData.hours_remaining)}h remaining`
            }
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">{ticketData.ticket_name}</h3>
          <p className="text-sm text-muted-foreground">{ticketData.ticket_description}</p>
        </div>

        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
          <span className="text-sm font-medium">Ticket Value</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(ticketData.ticket_price)}</span>
        </div>

        {ticketData.includes_free_drink && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Coffee className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Free Drink Available</p>
              <p className="text-xs text-muted-foreground">Redeem at the bar</p>
            </div>
            <Badge variant="secondary" className="bg-green-500/20">Active</Badge>
          </div>
        )}

        <TicketExpiryCountdown 
          purchaseTime={new Date(ticketData.purchase_date)}
          expiryHours={24}
        />

        {ticketData.hours_remaining < 2 && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-destructive">Ticket Expiring Soon</p>
              <p className="text-xs text-muted-foreground">
                Your ticket will expire in less than 2 hours
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Checked In</p>
            <p className="text-sm font-medium">
              {new Date(ticketData.checked_in_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
