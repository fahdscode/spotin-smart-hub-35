import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock, Users, MapPin, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RoomBooking from "./RoomBooking";

interface Room {
  id: string;
  name: string;
  capacity: number;
  hourly_rate: number;
  is_available: boolean;
  amenities: string[];
}

interface Reservation {
  id: string;
  room_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  created_at: string;
  room?: Room;
}

interface CalendarDay {
  date: Date;
  reservations: Reservation[];
  isCurrentMonth: boolean;
}

const RoomCalendar = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchRooms();
    fetchReservations();
  }, [currentDate, selectedRoom]);

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

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const startDate = startOfWeek(startOfMonth(currentDate));
      const endDate = endOfWeek(endOfMonth(currentDate));

      let query = supabase
        .from('reservations')
        .select(`
          *,
          room:rooms(*)
        `)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .order('start_time');

      if (selectedRoom !== 'all') {
        query = query.eq('room_id', selectedRoom);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast({
        title: "Error",
        description: "Failed to load reservations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCalendarDays = (): CalendarDay[] => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    const days = eachDayOfInterval({ start, end });

    return days.map(date => ({
      date,
      reservations: reservations.filter(res => 
        isSameDay(new Date(res.start_time), date)
      ),
      isCurrentMonth: date.getMonth() === currentDate.getMonth()
    }));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const getRoomColor = (roomId: string) => {
    const index = rooms.findIndex(room => room.id === roomId);
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800', 
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800'
    ];
    return colors[index % colors.length] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reservation cancelled successfully"
      });
      
      fetchReservations();
      setShowDetailsDialog(false);
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast({
        title: "Error", 
        description: "Failed to cancel reservation",
        variant: "destructive"
      });
    }
  };

  const calendarDays = getCalendarDays();

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {rooms.map(room => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
                <DialogDescription>
                  Book a room for a client
                </DialogDescription>
              </DialogHeader>
              <RoomBooking onBookingComplete={() => {
                setShowBookingDialog(false);
                fetchReservations();
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Room Reservations Calendar
          </CardTitle>
          <CardDescription>
            View and manage room bookings across all spaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[120px] p-2 border rounded-lg ${
                  day.isCurrentMonth ? 'bg-background' : 'bg-muted/50'
                } ${isSameDay(day.date, new Date()) ? 'ring-2 ring-primary' : ''}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {format(day.date, 'd')}
                </div>
                
                <div className="space-y-1">
                  {day.reservations.slice(0, 3).map(reservation => (
                    <div
                      key={reservation.id}
                      className={`p-1 rounded text-xs cursor-pointer hover:opacity-80 ${
                        getRoomColor(reservation.room_id)
                      }`}
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <div className="font-medium truncate">
                        {reservation.room?.name}
                      </div>
                      <div className="text-xs opacity-70">
                        {format(new Date(reservation.start_time), 'HH:mm')} - 
                        {format(new Date(reservation.end_time), 'HH:mm')}
                      </div>
                    </div>
                  ))}
                  
                  {day.reservations.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{day.reservations.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Room Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {rooms.map(room => (
              <Badge
                key={room.id}
                variant="outline"
                className={getRoomColor(room.id)}
              >
                {room.name} • ${room.hourly_rate}/hr • {room.capacity} seats
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reservation Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Room</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedReservation.room?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedReservation.status)}>
                    {selectedReservation.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Time</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedReservation.start_time), 'PPp')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Time</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedReservation.end_time), 'PPp')}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Total Amount</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedReservation.total_amount} EGP
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteReservation(selectedReservation.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomCalendar;