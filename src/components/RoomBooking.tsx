import { useState, useEffect } from "react";
import { Calendar, Clock, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Room {
  id: string;
  name: string;
  capacity: number;
  hourly_rate: number;
  is_available: boolean;
  amenities: string[];
  description?: string;
}

interface RoomBookingProps {
  onBookingComplete?: () => void;
}

const RoomBooking = ({ onBookingComplete }: RoomBookingProps) => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [participants, setParticipants] = useState<number>(1);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [recurringEndDate, setRecurringEndDate] = useState<Date>();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive"
      });
    }
  };

  const selectedRoomData = rooms.find(room => room.id === selectedRoom);

  const calculateTotal = () => {
    if (!selectedRoomData || !startTime || !endTime) return 0;
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    return hours * selectedRoomData.hourly_rate;
  };

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const handleBooking = async () => {
    if (!selectedRoom || !date || !startTime || !endTime || !clientName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (isRecurring && (recurringDays.length === 0 || !recurringEndDate)) {
      toast({
        title: "Error",
        description: "Please select recurring days and end date",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const datesToBook: Date[] = [];
      
      if (isRecurring && recurringEndDate) {
        // Generate all dates based on selected weekdays
        let currentDate = new Date(date);
        const endDate = new Date(recurringEndDate);
        
        while (currentDate <= endDate) {
          const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
          if (recurringDays.includes(dayName)) {
            datesToBook.push(new Date(currentDate));
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        datesToBook.push(date);
      }

      const reservations = datesToBook.map(bookingDate => {
        const startDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${startTime}:00`);
        const endDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${endTime}:00`);
        
        return {
          room_id: selectedRoom,
          user_id: '00000000-0000-0000-0000-000000000000',
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'confirmed',
          total_amount: calculateTotal(),
          client_name: clientName
        };
      });

      // Check for conflicts across all dates
      for (const reservation of reservations) {
        const { data: conflicts } = await supabase
          .from('reservations')
          .select('*')
          .eq('room_id', selectedRoom)
          .eq('status', 'confirmed')
          .or(`and(start_time.lte.${reservation.start_time},end_time.gte.${reservation.start_time}),and(start_time.lte.${reservation.end_time},end_time.gte.${reservation.end_time})`);

        if (conflicts && conflicts.length > 0) {
          toast({
            title: "Booking Conflict",
            description: `Room is already booked on ${format(new Date(reservation.start_time), 'PPP')}`,
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      // Create all reservations
      const { error } = await supabase
        .from('reservations')
        .insert(reservations);

      if (error) throw error;

      toast({
        title: "Success",
        description: isRecurring 
          ? `Created ${reservations.length} recurring bookings` 
          : "Room booked successfully!"
      });

      // Reset form
      setSelectedRoom("");
      setDate(undefined);
      setStartTime("");
      setEndTime("");
      setClientName("");
      setParticipants(1);
      setIsRecurring(false);
      setRecurringDays([]);
      setRecurringEndDate(undefined);

      onBookingComplete?.();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Room Booking</h2>
        <p className="text-muted-foreground">Reserve meeting rooms and private spaces</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Book a Room</CardTitle>
            <CardDescription>Fill in the details for your room reservation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client Name</Label>
              <Input
                id="client"
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Select Room</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} - ${room.hourly_rate}/hr
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participants">Number of Participants</Label>
              <Input
                id="participants"
                type="number"
                placeholder="1"
                value={participants}
                onChange={(e) => setParticipants(Number(e.target.value))}
                min="1"
              />
            </div>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="recurring" className="cursor-pointer">Recurring Booking</Label>
                <input
                  id="recurring"
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded"
                />
              </div>
              
              {isRecurring && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm mb-2 block">Repeat On</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setRecurringDays(prev => 
                              prev.includes(day) 
                                ? prev.filter(d => d !== day)
                                : [...prev, day]
                            );
                          }}
                          className={`px-2 py-1 text-xs rounded ${
                            recurringDays.includes(day)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !recurringEndDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {recurringEndDate ? format(recurringEndDate, "PPP") : <span>Pick end date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={recurringEndDate}
                          onSelect={setRecurringEndDate}
                          disabled={(date) => date < new Date() || (date && date < date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            {calculateTotal() > 0 && (
              <div className="bg-accent/10 p-4 rounded-lg">
                <div className="text-lg font-semibold text-accent">
                  Total: {calculateTotal()} EGP
                </div>
                <p className="text-sm text-muted-foreground">
                  Duration: {calculateDuration().toFixed(1)} hours
                </p>
              </div>
            )}

            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleBooking}
              disabled={loading}
            >
              {loading ? "Booking..." : "Book Room"}
            </Button>
          </CardContent>
        </Card>

        {/* Room Details & Available Rooms */}
        <div className="space-y-6">
          {selectedRoomData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {selectedRoomData.name}
                </CardTitle>
                <CardDescription>{selectedRoomData.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {selectedRoomData.capacity} people</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>${selectedRoomData.hourly_rate}/hour</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoomData.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Rooms List */}
          <Card>
            <CardHeader>
              <CardTitle>Available Rooms</CardTitle>
              <CardDescription>Browse all available meeting rooms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRoom === room.id ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedRoom(room.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{room.name}</h3>
                    <span className="text-lg font-semibold text-primary">
                      ${room.hourly_rate}/hr
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{room.capacity} people</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoomBooking;