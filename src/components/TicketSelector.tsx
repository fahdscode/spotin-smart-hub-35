import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Coffee, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Ticket {
  id: string;
  name: string;
  price: number;
  description: string;
  includes_free_drink: boolean;
  image_url?: string;
}

interface TicketSelectorProps {
  clientId: string;
  clientName: string;
  onTicketAssigned: (ticketData: any) => void;
  onCancel: () => void;
}

export const TicketSelector = ({ clientId, clientName, onTicketAssigned, onCancel }: TicketSelectorProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableTickets();
  }, []);

  const fetchAvailableTickets = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_tickets');
      
      if (error) throw error;
      
      const ticketsData = (data as any) || [];
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      if (Array.isArray(ticketsData) && ticketsData.length > 0) {
        setSelectedTicketId(ticketsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error Loading Tickets",
        description: "Could not fetch available tickets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedTicketId) {
      toast({
        title: "No Ticket Selected",
        description: "Please select a ticket to continue.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    
    try {
      const { data, error } = await supabase.rpc('assign_ticket_to_client', {
        p_client_id: clientId,
        p_ticket_id: selectedTicketId,
        p_payment_method: 'pending',
        p_duration_hours: 24
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        toast({
          title: "Ticket Assigned Successfully",
          description: `${clientName} now has a ${result.ticket_name} ticket`,
        });
        onTicketAssigned(result);
      } else {
        throw new Error(result?.error || "Failed to assign ticket");
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: "Ticket Assignment Failed",
        description: error instanceof Error ? error.message : "Could not assign ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No tickets available at the moment.</p>
          <Button onClick={onCancel} className="mt-4">Close</Button>
        </CardContent>
      </Card>
    );
  }

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Ticket for {clientName}</h3>
        <p className="text-sm text-muted-foreground">Choose a day use pass</p>
      </div>

      <RadioGroup value={selectedTicketId} onValueChange={setSelectedTicketId}>
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="relative">
              <RadioGroupItem
                value={ticket.id}
                id={ticket.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={ticket.id}
                className="flex flex-col cursor-pointer rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{ticket.name}</span>
                      {selectedTicketId === ticket.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                    {ticket.includes_free_drink && (
                      <Badge variant="secondary" className="gap-1">
                        <Coffee className="h-3 w-3" />
                        Includes Free Drink
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(ticket.price)}
                    </div>
                    <div className="text-xs text-muted-foreground">24 hours</div>
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>

      {selectedTicket && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ticket Price</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(selectedTicket.price)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button onClick={onCancel} variant="outline" className="flex-1" disabled={processing}>
          Cancel
        </Button>
        <Button onClick={handleAssignTicket} className="flex-1" disabled={processing}>
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Assign Ticket'
          )}
        </Button>
      </div>
    </div>
  );
};
