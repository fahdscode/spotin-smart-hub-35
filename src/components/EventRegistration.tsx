import { useState } from "react";
import { Ticket, QrCode, Download, Mail, User, CreditCard, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  price: number;
  capacity: number;
  ticketsSold: number;
  status: "draft" | "published" | "ongoing" | "completed";
}

interface RegistrationData {
  eventId: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  company?: string;
  specialRequests?: string;
  ticketQuantity: number;
}

interface GeneratedTicket {
  id: string;
  eventTitle: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketCode: string;
  qrCode: string;
  totalAmount: number;
  issueDate: string;
}

const EventRegistration = ({ events }: { events: Event[] }) => {
  const { toast } = useToast();
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [generatedTickets, setGeneratedTickets] = useState<GeneratedTicket[]>([]);
  
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    eventId: "",
    attendeeName: "",
    attendeeEmail: "",
    attendeePhone: "",
    company: "",
    specialRequests: "",
    ticketQuantity: 1
  });

  const generateTicketCode = () => {
    return `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const generateQRCode = (ticketCode: string) => {
    // In a real app, this would generate an actual QR code
    return `QR-${ticketCode}`;
  };

  const handleEventRegistration = () => {
    if (!selectedEvent || !registrationData.attendeeName || !registrationData.attendeeEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const ticketCode = generateTicketCode();
    const qrCode = generateQRCode(ticketCode);
    
    const newTicket: GeneratedTicket = {
      id: `TICKET-${Date.now()}`,
      eventTitle: selectedEvent.title,
      attendeeName: registrationData.attendeeName,
      attendeeEmail: registrationData.attendeeEmail,
      ticketCode,
      qrCode,
      totalAmount: selectedEvent.price * registrationData.ticketQuantity,
      issueDate: new Date().toISOString().split('T')[0]
    };

    setGeneratedTickets([...generatedTickets, newTicket]);
    
    // Reset form
    setRegistrationData({
      eventId: "",
      attendeeName: "",
      attendeeEmail: "",
      attendeePhone: "",
      company: "",
      specialRequests: "",
      ticketQuantity: 1
    });
    
    setIsRegistrationOpen(false);
    setSelectedEvent(null);

    toast({
      title: "Registration Successful!",
      description: `Ticket generated for ${registrationData.attendeeName}`,
    });
  };

  const openRegistrationForEvent = (event: Event) => {
    setSelectedEvent(event);
    setRegistrationData(prev => ({ ...prev, eventId: event.id }));
    setIsRegistrationOpen(true);
  };

  const downloadTicket = (ticket: GeneratedTicket) => {
    // In a real app, this would generate and download a PDF ticket
    toast({
      title: "Ticket Downloaded",
      description: `Ticket ${ticket.ticketCode} downloaded successfully`,
    });
  };

  const emailTicket = (ticket: GeneratedTicket) => {
    // In a real app, this would send the ticket via email
    toast({
      title: "Ticket Emailed",
      description: `Ticket sent to ${ticket.attendeeEmail}`,
    });
  };

  const availableEvents = events.filter(event => event.status === "published");

  return (
    <div className="space-y-6">
      {/* Registration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Event Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 space-y-3">
                <div>
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {event.date} at {event.time}
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">€{event.price}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.capacity - event.ticketsSold} spots left
                    </div>
                  </div>
                  <Badge variant="outline">
                    {event.ticketsSold}/{event.capacity}
                  </Badge>
                </div>

                <Button 
                  className="w-full" 
                  variant="professional"
                  onClick={() => openRegistrationForEvent(event)}
                  disabled={event.ticketsSold >= event.capacity}
                >
                  {event.ticketsSold >= event.capacity ? "Sold Out" : "Register Now"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated Tickets */}
      {generatedTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Generated Tickets ({generatedTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedTickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{ticket.eventTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        Ticket: {ticket.ticketCode}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-xs font-medium">Attendee</Label>
                      <div className="text-sm">{ticket.attendeeName}</div>
                      <div className="text-xs text-muted-foreground">{ticket.attendeeEmail}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Amount Paid</Label>
                      <div className="text-sm font-semibold">{ticket.totalAmount.toFixed(2)} EGP</div>
                      <div className="text-xs text-muted-foreground">Issued: {ticket.issueDate}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">QR Code</Label>
                      <div className="text-sm font-mono">{ticket.qrCode}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadTicket(ticket)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => emailTicket(ticket)}
                      className="flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      Email Ticket
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <QrCode className="h-3 w-3" />
                      Show QR
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Dialog */}
      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register for Event</DialogTitle>
            <DialogDescription>
              {selectedEvent && `Complete registration for: ${selectedEvent.title}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="attendeeName">Full Name *</Label>
                <Input
                  id="attendeeName"
                  value={registrationData.attendeeName}
                  onChange={(e) => setRegistrationData(prev => ({...prev, attendeeName: e.target.value}))}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="ticketQuantity">Tickets</Label>
                <Select
                  value={registrationData.ticketQuantity.toString()}
                  onValueChange={(value) => setRegistrationData(prev => ({...prev, ticketQuantity: parseInt(value)}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num} ticket{num > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="attendeeEmail">Email Address *</Label>
              <Input
                id="attendeeEmail"
                type="email"
                value={registrationData.attendeeEmail}
                onChange={(e) => setRegistrationData(prev => ({...prev, attendeeEmail: e.target.value}))}
                placeholder="Enter email address"
              />
            </div>

            <div>
              <Label htmlFor="attendeePhone">Phone Number</Label>
              <Input
                id="attendeePhone"
                value={registrationData.attendeePhone}
                onChange={(e) => setRegistrationData(prev => ({...prev, attendeePhone: e.target.value}))}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <Label htmlFor="company">Company/Organization</Label>
              <Input
                id="company"
                value={registrationData.company}
                onChange={(e) => setRegistrationData(prev => ({...prev, company: e.target.value}))}
                placeholder="Enter company name (optional)"
              />
            </div>

            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={registrationData.specialRequests}
                onChange={(e) => setRegistrationData(prev => ({...prev, specialRequests: e.target.value}))}
                placeholder="Any dietary restrictions, accessibility needs, etc."
                rows={3}
              />
            </div>

            {selectedEvent && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold">
                    {(selectedEvent.price * registrationData.ticketQuantity).toFixed(2)} EGP
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsRegistrationOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleEventRegistration} variant="professional" className="flex-1">
              <CreditCard className="h-4 w-4 mr-2" />
              Complete Registration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventRegistration;