import { useState, useEffect } from "react";
import { Calendar, Clock, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

    setLoading(true);
    try {
      const startDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${startTime}:00`);
      const endDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${endTime}:00`);
      
      // Check for conflicts
      const { data: existingReservations, error: checkError } = await supabase
        .from('reservations')
        .select('*')
        .eq('room_id', selectedRoom)
        .eq('status', 'confirmed')
        .or(`and(start_time.lte.${startDateTime.toISOString()},end_time.gte.${startDateTime.toISOString()}),and(start_time.lte.${endDateTime.toISOString()},end_time.gte.${endDateTime.toISOString()}),and(start_time.gte.${startDateTime.toISOString()},end_time.lte.${endDateTime.toISOString()})`);

      if (checkError) throw checkError;

      if (existingReservations && existingReservations.length > 0) {
        toast({
          title: "Booking Conflict",
          description: "This room is already booked for the selected time",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Create reservation
      const { error } = await supabase
        .from('reservations')
        .insert({
          room_id: selectedRoom,
          user_id: '00000000-0000-0000-0000-000000000000', // Placeholder - in real app would use actual user
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'confirmed',
          total_amount: calculateTotal()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room booked successfully!"
      });

      // Reset form
      setSelectedRoom("");
      setDate(undefined);
      setStartTime("");
      setEndTime("");
      setClientName("");
      setParticipants(1);

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