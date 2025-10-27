import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Coffee, Ticket, AlertCircle, Sparkles, Gift } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { TicketExpiryCountdown } from './TicketExpiryCountdown';
import * as ClientSound from '@/lib/clientSounds';
import { toast } from 'sonner';

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

interface Drink {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  category: string;
  is_available: boolean;
}

export const ActiveTicketCard = ({ clientId }: ActiveTicketCardProps) => {
  const [ticketData, setTicketData] = useState<ActiveTicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDrinkSelector, setShowDrinkSelector] = useState(false);
  const [availableDrinks, setAvailableDrinks] = useState<Drink[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);

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

  const fetchDrinks = async () => {
    try {
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .eq('is_available', true)
        .in('category', ['beverage', 'hot_drinks', 'cold_drinks'])
        .order('name');

      if (error) throw error;
      setAvailableDrinks(data || []);
    } catch (error) {
      console.error('Error fetching drinks:', error);
      toast.error('Failed to load drinks');
    }
  };

  const handleClaimFreeDrink = () => {
    ClientSound.playPopupOpen();
    fetchDrinks();
    setShowDrinkSelector(true);
  };

  const handleSelectDrink = async (drink: Drink) => {
    setSelectedDrink(drink);
    ClientSound.playSuccess();
    
    try {
      // Add the drink to orders with price 0 (free)
      const { error } = await supabase.from('session_line_items').insert({
        user_id: clientId,
        item_name: drink.name,
        quantity: 1,
        price: 0, // Free drink
        status: 'pending',
        notes: 'Free drink from day pass ticket'
      });

      if (error) throw error;

      toast.success(`${drink.name} claimed! Your free drink order has been sent to the barista.`, {
        description: 'Show this at the bar to redeem your drink',
        duration: 5000
      });

      setTimeout(() => {
        setShowDrinkSelector(false);
        setSelectedDrink(null);
      }, 2000);
    } catch (error) {
      console.error('Error claiming free drink:', error);
      ClientSound.playError();
      toast.error('Failed to claim free drink. Please try again.');
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
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 animate-fade-in">
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
            <div className="relative overflow-hidden">
              <Button
                onClick={handleClaimFreeDrink}
                className="w-full h-auto py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-full animate-bounce-gentle">
                      <Gift className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg flex items-center gap-2">
                        Claim Your Free Drink
                        <Sparkles className="h-5 w-5 animate-pulse" />
                      </p>
                      <p className="text-xs text-white/90">Tap to choose from our menu</p>
                    </div>
                  </div>
                  <Coffee className="h-8 w-8 group-hover:animate-wiggle" />
                </div>
              </Button>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
            </div>
          )}

          <TicketExpiryCountdown 
            purchaseTime={new Date(ticketData.purchase_date)}
            expiryHours={24}
          />

          {ticketData.hours_remaining < 2 && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-pulse-soft">
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

      {/* Drink Selector Dialog */}
      <Dialog open={showDrinkSelector} onOpenChange={(open) => {
        if (!open) ClientSound.playPopupClose();
        setShowDrinkSelector(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Gift className="h-6 w-6 text-green-500" />
              Choose Your Free Drink! 🎉
            </DialogTitle>
            <DialogDescription>
              Select any drink from our menu - it's on us!
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {availableDrinks.map((drink) => (
              <Card
                key={drink.id}
                className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                  selectedDrink?.id === drink.id ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950' : 'hover:bg-muted/50'
                }`}
                onClick={() => handleSelectDrink(drink)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{drink.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{drink.description}</p>
                      <Badge variant="secondary" className="text-xs">
                        {drink.category}
                      </Badge>
                    </div>
                    <Coffee className={`h-6 w-6 ml-2 ${selectedDrink?.id === drink.id ? 'text-green-500 animate-bounce-gentle' : 'text-muted-foreground'}`} />
                  </div>
                  {selectedDrink?.id === drink.id && (
                    <div className="mt-3 p-2 bg-green-500/10 rounded-lg text-center">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Selected! Sending to barista...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};