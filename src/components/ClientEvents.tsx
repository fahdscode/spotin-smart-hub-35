import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Users, DollarSign, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  capacity: number;
  registered_attendees: number;
  price: number;
  category: string;
  is_active: boolean;
  image_url: string | null;
}

interface EventRegistration {
  event_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  special_requests?: string;
}

interface ClientEventsProps {
  clientData: any;
}

const ClientEvents = ({ clientData }: ClientEventsProps) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [registrationForm, setRegistrationForm] = useState<EventRegistration>({
    event_id: '',
    attendee_name: '',
    attendee_email: '',
    attendee_phone: '',
    special_requests: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterForEvent = (event: Event) => {
    setSelectedEvent(event);
    setRegistrationForm({
      event_id: event.id,
      attendee_name: clientData?.fullName || '',
      attendee_email: clientData?.email || '',
      attendee_phone: clientData?.phone || '',
      special_requests: ''
    });
    setIsRegistrationOpen(true);
  };

  const submitRegistration = async () => {
    if (!selectedEvent) return;

    // Check if event is full
    if (selectedEvent.registered_attendees >= selectedEvent.capacity) {
      toast({
        title: "Event Full",
        description: "This event has reached its capacity.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Insert into event_registrations table
      const { error } = await supabase
        .from('event_registrations')
        .insert([{
          event_id: selectedEvent.id,
          attendee_name: registrationForm.attendee_name,
          attendee_email: registrationForm.attendee_email,
          attendee_phone: registrationForm.attendee_phone,
          client_id: clientData?.id || null,
          special_requests: registrationForm.special_requests || null
        }]);

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: `You're registered for ${selectedEvent.title}. We'll send you a confirmation email.`,
      });

      setIsRegistrationOpen(false);
      fetchEvents(); // Refresh events to show updated attendee count
    } catch (error) {
      console.error('Error registering for event:', error);
      toast({
        title: "Registration Failed",
        description: "Failed to register for event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'workshop': return 'bg-blue-500/10 text-blue-600';
      case 'networking': return 'bg-green-500/10 text-green-600';
      case 'social': return 'bg-purple-500/10 text-purple-600';
      case 'training': return 'bg-orange-500/10 text-orange-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const isEventToday = (eventDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    return eventDate === today;
  };

  const isEventSoon = (eventDate: string) => {
    const eventDateObj = new Date(eventDate);
    const today = new Date();
    const diffTime = eventDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Upcoming Events</h2>
        <Badge variant="outline">{events.length} events available</Badge>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Upcoming Events</h3>
            <p className="text-muted-foreground">
              Check back soon for exciting community events and workshops!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{event.title}</h3>
                        <p className="text-muted-foreground mt-1">{event.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getCategoryColor(event.category)}>
                          {event.category}
                        </Badge>
                        {isEventToday(event.event_date) && (
                          <Badge variant="destructive">Today</Badge>
                        )}
                        {isEventSoon(event.event_date) && !isEventToday(event.event_date) && (
                          <Badge variant="secondary">Soon</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{event.start_time} - {event.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location || 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{event.registered_attendees}/{event.capacity} registered</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {event.price > 0 ? `${event.price} EGP` : 'Free'}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleRegisterForEvent(event)}
                        disabled={event.registered_attendees >= event.capacity}
                        variant={event.registered_attendees >= event.capacity ? "secondary" : "default"}
                      >
                        {event.registered_attendees >= event.capacity ? 'Event Full' : 'Register Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Registration Dialog */}
      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register for Event</DialogTitle>
            <DialogDescription>
              {selectedEvent?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {selectedEvent && (
              <div className="space-y-2 p-4 bg-muted rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedEvent.event_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{selectedEvent.start_time} - {selectedEvent.end_time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedEvent.location || 'Location TBD'}</span>
                </div>
                {selectedEvent.price > 0 && (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4" />
                    <span>{selectedEvent.price} EGP</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="attendee_name">Full Name</Label>
              <Input
                id="attendee_name"
                value={registrationForm.attendee_name}
                onChange={(e) => setRegistrationForm(prev => ({ ...prev, attendee_name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="attendee_email">Email</Label>
              <Input
                id="attendee_email"
                type="email"
                value={registrationForm.attendee_email}
                onChange={(e) => setRegistrationForm(prev => ({ ...prev, attendee_email: e.target.value }))}
                placeholder="Your email address"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="attendee_phone">Phone</Label>
              <Input
                id="attendee_phone"
                value={registrationForm.attendee_phone}
                onChange={(e) => setRegistrationForm(prev => ({ ...prev, attendee_phone: e.target.value }))}
                placeholder="Your phone number"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="special_requests">Special Requests (Optional)</Label>
              <Textarea
                id="special_requests"
                value={registrationForm.special_requests}
                onChange={(e) => setRegistrationForm(prev => ({ ...prev, special_requests: e.target.value }))}
                placeholder="Any special requirements or dietary restrictions?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegistrationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRegistration}>
              Confirm Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientEvents;