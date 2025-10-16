import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Clock, CheckCircle2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/currency";

interface DayTicket {
  id: string;
  name: string;
  price: number;
  description: string;
  validity_hours: number;
}

interface ActiveTicket {
  id: string;
  purchased_at: string;
  expires_at: string;
  ticket_name: string;
  validity_hours: number;
}

const ClientDayUseTicketPurchase = () => {
  const { toast } = useToast();
  const { clientData } = useAuth();
  const [ticket, setTicket] = useState<DayTicket | null>(null);
  const [activeTicket, setActiveTicket] = useState<ActiveTicket | null>(null);
  const [hasMembership, setHasMembership] = useState(false);
  const [membershipHasFreeDayPass, setMembershipHasFreeDayPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (clientData?.id) {
      fetchTicketData();
      checkMembership();
      checkActiveTicket();
    }
  }, [clientData]);

  const fetchTicketData = async () => {
    try {
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .eq('category', 'day_use_ticket')
        .eq('is_available', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setTicket({
          id: data.id,
          name: data.name,
          price: data.price,
          description: data.description || "Full day access to workspace",
          validity_hours: 8 // Default to 8 hours
        });
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!clientData?.id) return;

    try {
      const { data, error } = await supabase
        .from('client_memberships')
        .select('plan_name, perks')
        .eq('client_id', clientData.id)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setHasMembership(true);
        // Check if membership includes free daily pass in perks
        const hasFreeDayPass = data.perks?.some((perk: string) => 
          perk.toLowerCase().includes('free day') || 
          perk.toLowerCase().includes('daily pass')
        );
        setMembershipHasFreeDayPass(hasFreeDayPass);
      }
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  };

  const checkActiveTicket = async () => {
    if (!clientData?.id) return;

    try {
      // Check if client has an active ticket (stored in session_line_items or a dedicated table)
      const { data, error } = await supabase
        .from('session_line_items')
        .select('*')
        .eq('user_id', clientData.id)
        .eq('item_name', ticket?.name || 'Day Use Pass')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const purchaseTime = new Date(data.created_at);
        const expiryTime = new Date(purchaseTime.getTime() + (ticket?.validity_hours || 8) * 60 * 60 * 1000);
        
        if (new Date() < expiryTime) {
          setActiveTicket({
            id: data.id,
            purchased_at: data.created_at,
            expires_at: expiryTime.toISOString(),
            ticket_name: data.item_name,
            validity_hours: ticket?.validity_hours || 8
          });
        }
      }
    } catch (error) {
      console.error('Error checking active ticket:', error);
    }
  };

  const handlePurchase = async () => {
    if (!ticket || !clientData?.id) return;

    setPurchasing(true);
    try {
      const finalPrice = membershipHasFreeDayPass ? 0 : ticket.price;

      // Create order for day-use ticket
      const { error } = await supabase
        .from('session_line_items')
        .insert({
          user_id: clientData.id,
          item_name: ticket.name,
          quantity: 1,
          price: finalPrice,
          status: 'completed' // Auto-complete for tickets
        });

      if (error) throw error;

      const expiryTime = new Date(Date.now() + ticket.validity_hours * 60 * 60 * 1000);
      
      setActiveTicket({
        id: Date.now().toString(),
        purchased_at: new Date().toISOString(),
        expires_at: expiryTime.toISOString(),
        ticket_name: ticket.name,
        validity_hours: ticket.validity_hours
      });

      toast({
        title: membershipHasFreeDayPass ? "Free Ticket Activated!" : "Ticket Purchased!",
        description: `Your ${ticket.name} is now active and valid for ${ticket.validity_hours} hours.`,
      });
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      toast({
        title: "Error",
        description: "Failed to purchase ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const getRemainingTime = () => {
    if (!activeTicket) return null;
    
    const now = new Date();
    const expiry = new Date(activeTicket.expires_at);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!ticket) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Day Use Tickets</CardTitle>
          <CardDescription>No day-use tickets are currently available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (activeTicket) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle>Active Day Use Ticket</CardTitle>
          </div>
          <CardDescription>You have an active day-use pass</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-semibold mb-2">{activeTicket.ticket_name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{getRemainingTime()}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Purchased: {new Date(activeTicket.purchased_at).toLocaleString()}
            </p>
          </div>
          
          <Badge variant="default" className="w-full justify-center py-2">
            Valid until {new Date(activeTicket.expires_at).toLocaleTimeString()}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <CardTitle>Day Use Tickets</CardTitle>
        </div>
        <CardDescription>Get access to our workspace for the day</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold">{ticket.name}</h3>
              <p className="text-sm text-muted-foreground">{ticket.description}</p>
            </div>
            {membershipHasFreeDayPass ? (
              <Badge variant="default" className="ml-2">FREE</Badge>
            ) : (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {formatCurrency(ticket.price)}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
            <Clock className="h-4 w-4" />
            <span>Valid for {ticket.validity_hours} hours</span>
          </div>
        </div>

        {membershipHasFreeDayPass && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              ✨ As a member, you get free day-use tickets!
            </p>
          </div>
        )}

        <Button 
          onClick={handlePurchase} 
          disabled={purchasing}
          className="w-full"
        >
          {purchasing ? 'Processing...' : membershipHasFreeDayPass ? 'Activate Free Pass' : 'Purchase Ticket'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClientDayUseTicketPurchase;
