import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Coffee, Ticket, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';

import { toast } from 'sonner';
interface ActiveTicketData {
  id: string;
  ticket_name: string;
  ticket_price: number;
  ticket_description: string;
  includes_free_drink: boolean;
  max_free_drink_price: number;
  free_drink_claimed: boolean;
  free_drink_claimed_at: string | null;
  claimed_drink_name: string | null;
  purchase_date: string;
  expiry_date: string;
  checked_in_at: string;
  hours_remaining: number;
}
interface ActiveTicketCardProps {
  clientId: string;
}
export const ActiveTicketCard = ({
  clientId
}: ActiveTicketCardProps) => {
  const [ticketData, setTicketData] = useState<ActiveTicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableDrinks, setAvailableDrinks] = useState<any[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
  const [showDrinkDialog, setShowDrinkDialog] = useState(false);
  const [claiming, setClaiming] = useState(false);
  useEffect(() => {
    fetchActiveTicket();

    // Subscribe to ticket changes
    const channel = supabase.channel('client-ticket-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'client_tickets',
      filter: `client_id=eq.${clientId}`
    }, () => {
      fetchActiveTicket();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);
  const fetchActiveTicket = async () => {
    try {
      const {
        data,
        error
      } = await supabase.rpc('get_client_active_ticket', {
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

  const fetchAvailableDrinks = async () => {
    if (!ticketData?.includes_free_drink || ticketData.free_drink_claimed) return;
    
    try {
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .neq('category', 'day_use_ticket')
        .eq('is_available', true)
        .lte('price', ticketData.max_free_drink_price)
        .order('price', { ascending: true });
      
      if (error) throw error;
      setAvailableDrinks(data || []);
    } catch (error) {
      console.error('Error fetching drinks:', error);
    }
  };

  const handleClaimFreeDrink = async () => {
    if (!selectedDrink || !ticketData) return;
    
    setClaiming(true);
    try {
      const drink = availableDrinks.find(d => d.id === selectedDrink);
      
      if (!drink) {
        toast.error('Selected drink not found');
        return;
      }

      // Use edge function to claim free drink (handles RLS policies)
      const { data, error } = await supabase.functions.invoke('claim-free-drink', {
        body: {
          ticket_id: ticketData.id,
          client_id: clientId,
          drink_id: drink.id,
          drink_name: drink.name,
          ticket_name: ticketData.ticket_name
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to claim drink');
      
      toast.success(`Your ${drink.name} has been ordered! Check with the barista.`);
      setShowDrinkDialog(false);
      fetchActiveTicket();
    } catch (error) {
      console.error('Error claiming drink:', error);
      toast.error('Failed to claim drink. Please try again.');
    } finally {
      setClaiming(false);
    }
  };
  if (loading) {
    return null;
  }
  if (!ticketData) {
    return null;
  }
  return <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Active Day Pass</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Active
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

        {ticketData.includes_free_drink && !ticketData.free_drink_claimed && (
          <Button
            onClick={() => {
              fetchAvailableDrinks();
              setShowDrinkDialog(true);
            }}
            className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
          >
            <Coffee className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform" />
            <span className="text-lg">Claim Your FREE Drink! 🎉</span>
            <Coffee className="h-6 w-6 ml-3 group-hover:-rotate-12 transition-transform" />
          </Button>
        )}

        {ticketData.includes_free_drink && ticketData.free_drink_claimed && (
          <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-500/50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-bold text-green-700 dark:text-green-400">
                Free Drink Claimed! ✓
              </p>
              <p className="text-xs text-muted-foreground">
                {ticketData.claimed_drink_name} • {ticketData.free_drink_claimed_at && new Date(ticketData.free_drink_claimed_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        <div className="p-3 bg-background/50 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Valid until check-out</span>
          </div>
        </div>
      </CardContent>

      <Dialog open={showDrinkDialog} onOpenChange={setShowDrinkDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Coffee className="h-6 w-6 text-green-600" />
              Choose Your Free Drink
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Select any drink up to {formatCurrency(ticketData?.max_free_drink_price || 0)}
            </p>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {availableDrinks.map((drink) => (
              <Card
                key={drink.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  selectedDrink === drink.id 
                    ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950' 
                    : 'hover:ring-1 hover:ring-green-300'
                }`}
                onClick={() => {
                  setSelectedDrink(drink.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{drink.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {drink.description}
                      </p>
                    </div>
                    {selectedDrink === drink.id && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {drink.category}
                    </Badge>
                    <span className="text-sm line-through text-muted-foreground">
                      {formatCurrency(drink.price)}
                    </span>
                    <Badge className="bg-green-500">FREE</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {availableDrinks.length === 0 && (
            <div className="text-center py-8">
              <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                No drinks available within your free drink price limit
              </p>
            </div>
          )}
          
          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleClaimFreeDrink}
              disabled={!selectedDrink || claiming}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {claiming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ordering...
                </>
              ) : (
                <>
                  <Coffee className="h-4 w-4 mr-2" />
                  Claim Selected Drink
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowDrinkDialog(false)}
              variant="outline"
              disabled={claiming}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>;
};