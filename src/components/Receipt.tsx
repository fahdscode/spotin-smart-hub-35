import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Receipt as ReceiptIcon, Download, Mail, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

interface ReceiptProps {
  sessionId: string;
  clientId: string;
  onClose: () => void;
}

const Receipt = ({ sessionId, clientId, onClose }: ReceiptProps) => {
  const [client, setClient] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [dayUseTicket, setDayUseTicket] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReceipt();
  }, [sessionId, clientId]);

  const generateReceipt = async () => {
    try {
      // Get client info
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      // Get session info
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      // Get day use ticket settings if client has membership
      let dayUseTicketData = null;
      if (clientData?.has_membership) {
        const { data: ticketData } = await supabase
          .from('day_use_ticket_settings')
          .select('*')
          .eq('is_active', true)
          .single();
        dayUseTicketData = ticketData;
      }

      setClient(clientData);
      setSession(sessionData);
      setDayUseTicket(dayUseTicketData);

      // Generate receipt items
      const items: ReceiptItem[] = [
        {
          name: `${sessionData.session_type} - ${sessionData.seat_number || sessionData.room_number}`,
          price: 0, // Base session is free for members, could be configurable
        }
      ];

      // Add day use ticket if client has membership
      if (clientData?.has_membership && dayUseTicketData) {
        items.push({
          name: dayUseTicketData.name,
          price: parseFloat(dayUseTicketData.price),
        });
      }

      const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

      // Create receipt record in database
      const { data: receiptData } = await supabase
        .from('receipts')
        .insert({
          session_id: sessionId,
          client_id: clientId,
          total_amount: totalAmount,
          items: JSON.stringify(items),
          day_use_ticket_added: !!(clientData?.has_membership && dayUseTicketData),
          day_use_ticket_price: dayUseTicketData ? parseFloat(dayUseTicketData.price) : 0,
        })
        .select()
        .single();

      setReceipt({ ...receiptData, items });
      setLoading(false);

    } catch (error) {
      console.error('Error generating receipt:', error);
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (checkIn: string, checkOut: string) => {
    const duration = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Generating receipt...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-2">
          <ReceiptIcon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>SpotIN Receipt</CardTitle>
        <p className="text-sm text-muted-foreground">Thank you for visiting!</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Client Info */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Client:</span>
            <span>{client?.name}</span>
          </div>
          {client?.has_membership && (
            <div className="flex justify-between">
              <span className="font-medium">Membership:</span>
              <Badge variant="default">{client.membership_type}</Badge>
            </div>
          )}
        </div>

        <Separator />

        {/* Session Details */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Session Type:</span>
            <span>{session?.session_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Location:</span>
            <span>{session?.seat_number || session?.room_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Check-in:</span>
            <span className="text-sm">{formatTime(session?.check_in_time)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Check-out:</span>
            <span className="text-sm">{formatTime(session?.check_out_time || new Date().toISOString())}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Duration:</span>
            <span>{formatDuration(session?.check_in_time, session?.check_out_time || new Date().toISOString())}</span>
          </div>
        </div>

        <Separator />

        {/* Receipt Items */}
        <div className="space-y-2">
          <h4 className="font-medium">Items:</h4>
          {receipt?.items?.map((item: ReceiptItem, index: number) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.name}</span>
              <span>${item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Day Use Ticket */}
        {dayUseTicket && client?.has_membership && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="h-4 w-4 text-success" />
              <span className="font-medium text-success">Day Use Ticket Added!</span>
            </div>
            <p className="text-sm text-muted-foreground">{dayUseTicket.description}</p>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>${receipt?.total_amount?.toFixed(2) || '0.00'}</span>
        </div>

        {/* Receipt ID */}
        <div className="text-center text-xs text-muted-foreground">
          Receipt ID: {receipt?.id?.slice(-8)}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>

        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </CardContent>
    </Card>
  );
};

export default Receipt;