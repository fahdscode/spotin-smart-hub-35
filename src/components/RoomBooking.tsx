import { useState } from "react";
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

interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  hourlyRate: number;
  amenities: string[];
}

const rooms: Room[] = [
  {
    id: "meeting1",
    name: "Conference Room A",
    capacity: 12,
    location: "2nd Floor",
    hourlyRate: 25,
    amenities: ["Projector", "Whiteboard", "Video Call"]
  },
  {
    id: "meeting2", 
    name: "Meeting Room B",
    capacity: 6,
    location: "1st Floor",
    hourlyRate: 15,
    amenities: ["TV Screen", "Whiteboard"]
  },
  {
    id: "phone1",
    name: "Phone Booth 1",
    capacity: 1,
    location: "1st Floor",
    hourlyRate: 8,
    amenities: ["Soundproof", "Phone"]
  }
];

const RoomBooking = () => {
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [participants, setParticipants] = useState<string>("");

  const selectedRoomData = rooms.find(room => room.id === selectedRoom);

  const calculateTotal = () => {
    if (!selectedRoomData || !startTime || !endTime) return 0;
    
    const start = new Date(`2024-01-01 ${startTime}`);
    const end = new Date(`2024-01-01 ${endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    return Math.max(0, hours * selectedRoomData.hourlyRate);
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
                      {room.name} - ${room.hourlyRate}/hr
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
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
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
                onChange={(e) => setParticipants(e.target.value)}
                min="1"
              />
            </div>

            {calculateTotal() > 0 && (
              <div className="bg-accent/10 p-4 rounded-lg">
                <div className="text-lg font-semibold text-accent">
                  Total: ${calculateTotal()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Duration: {((new Date(`2024-01-01 ${endTime}`).getTime() - new Date(`2024-01-01 ${startTime}`).getTime()) / (1000 * 60 * 60)).toFixed(1)} hours
                </p>
              </div>
            )}

            <Button className="w-full" size="lg">
              Book Room
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
                <CardDescription>{selectedRoomData.location}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {selectedRoomData.capacity} people</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>${selectedRoomData.hourlyRate}/hour</span>
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

          <Card>
            <CardHeader>
              <CardTitle>Available Rooms</CardTitle>
              <CardDescription>Browse all available meeting spaces</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-all",
                      selectedRoom === room.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedRoom(room.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{room.name}</h4>
                      <span className="text-sm font-medium text-accent">
                        ${room.hourlyRate}/hr
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {room.capacity}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {room.location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoomBooking;