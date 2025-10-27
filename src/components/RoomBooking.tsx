import { useState, useEffect } from "react";
import { Calendar, Clock, Users, MapPin, Search, Plus, Trash2, Receipt as ReceiptIcon, Percent, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import Receipt from "./Receipt";

interface Room {
  id: string;
  name: string;
  capacity: number;
  hourly_rate: number;
  is_available: boolean;
  amenities: string[];
  description?: string;
}

interface Client {
  id: string;
  full_name: string;
  client_code: string;
  email: string;
  phone: string;
}

interface Reservation {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  amount: number;
}

interface RoomBookingProps {
  onBookingComplete?: () => void;
}

const RoomBooking = ({ onBookingComplete }: RoomBookingProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>();
  const [currentStartTime, setCurrentStartTime] = useState<string>("");
  const [currentEndTime, setCurrentEndTime] = useState<string>("");
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (clientSearch.length >= 2) {
      searchClients();
    } else {
      setClients([]);
    }
  }, [clientSearch]);

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
      toast.error("Failed to load rooms");
    }
  };

  const searchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name, client_code, email, phone')
        .eq('is_active', true)
        .or(`full_name.ilike.%${clientSearch}%,client_code.ilike.%${clientSearch}%,phone.ilike.%${clientSearch}%`)
        .limit(10);

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error searching clients:', error);
    }
  };

  const selectedRoomData = rooms.find(room => room.id === selectedRoom);

  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  };

  const addReservation = () => {
    if (!currentDate || !currentStartTime || !currentEndTime || !selectedRoomData) {
      toast.error("Please fill in date and time");
      return;
    }

    const duration = calculateDuration(currentStartTime, currentEndTime);
    if (duration <= 0) {
      toast.error("End time must be after start time");
      return;
    }

    // Check if this date already exists
    const existingReservation = reservations.find(
      r => format(r.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
    );

    if (existingReservation) {
      toast.error("Reservation for this date already added");
      return;
    }

    const amount = duration * selectedRoomData.hourly_rate;

    const newReservation: Reservation = {
      id: Math.random().toString(36).substr(2, 9),
      date: currentDate,
      startTime: currentStartTime,
      endTime: currentEndTime,
      duration,
      amount
    };

    setReservations([...reservations, newReservation]);
    setCurrentDate(undefined);
    setCurrentStartTime("");
    setCurrentEndTime("");
    toast.success("Reservation added");
  };

  const removeReservation = (id: string) => {
    setReservations(reservations.filter(r => r.id !== id));
  };

  const calculateSubtotal = () => {
    return reservations.reduce((sum, r) => sum + r.amount, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === "percentage") {
      return (subtotal * discountValue) / 100;
    } else if (discountType === "fixed") {
      return Math.min(discountValue, subtotal);
    }
    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const getTotalHours = () => {
    return reservations.reduce((sum, r) => sum + r.duration, 0);
  };

  const handleBooking = async () => {
    if (!selectedClient) {
      toast.error("Please select a client");
      return;
    }

    if (!selectedRoom) {
      toast.error("Please select a room");
      return;
    }

    if (reservations.length === 0) {
      toast.error("Please add at least one reservation");
      return;
    }

    setLoading(true);
    try {
      // Check for conflicts
      for (const reservation of reservations) {
        const startDateTime = new Date(`${format(reservation.date, 'yyyy-MM-dd')}T${reservation.startTime}:00`);
        const endDateTime = new Date(`${format(reservation.date, 'yyyy-MM-dd')}T${reservation.endTime}:00`);

        const { data: conflicts } = await supabase
          .from('reservations')
          .select('*')
          .eq('room_id', selectedRoom)
          .eq('status', 'confirmed')
          .gte('start_time', startDateTime.toISOString())
          .lte('end_time', endDateTime.toISOString());

        if (conflicts && conflicts.length > 0) {
          toast.error(`Room is already booked on ${format(reservation.date, 'PPP')}`);
          setLoading(false);
          return;
        }
      }

      // Create reservations
      const reservationInserts = reservations.map(reservation => {
        const startDateTime = new Date(`${format(reservation.date, 'yyyy-MM-dd')}T${reservation.startTime}:00`);
        const endDateTime = new Date(`${format(reservation.date, 'yyyy-MM-dd')}T${reservation.endTime}:00`);

        return {
          room_id: selectedRoom,
          user_id: selectedClient.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'confirmed',
          total_amount: reservation.amount,
          client_name: selectedClient.full_name
        };
      });

      const { error: reservationError } = await supabase
        .from('reservations')
        .insert(reservationInserts);

      if (reservationError) throw reservationError;

      // Create receipt
      const receiptNumber = `RCP-ROOM-${Date.now()}`;
      const receiptItems = reservations.map(r => ({
        name: `${selectedRoomData?.name} - ${format(r.date, 'PPP')}`,
        quantity: 1,
        price: r.amount,
        total: r.amount,
        details: `${r.startTime} - ${r.endTime} (${r.duration.toFixed(1)}h)`
      }));

      const subtotal = calculateSubtotal();
      const discount = calculateDiscount();
      const total = calculateTotal();

      const { error: receiptError } = await supabase
        .from('receipts')
        .insert({
          receipt_number: receiptNumber,
          user_id: selectedClient.id,
          total_amount: total,
          amount: total,
          payment_method: 'Cash',
          transaction_type: 'room_booking',
          line_items: receiptItems,
          status: 'completed'
        });

      if (receiptError) throw receiptError;

      // Prepare receipt data for display
      setReceiptData({
        receiptNumber,
        customerName: selectedClient.full_name,
        customerEmail: selectedClient.email,
        userId: selectedClient.id,
        items: receiptItems,
        subtotal,
        discount,
        total,
        paymentMethod: 'Cash',
        date: new Date().toLocaleDateString(),
        totalHours: getTotalHours(),
        roomName: selectedRoomData?.name
      });

      toast.success(`${reservations.length} reservation(s) created successfully!`);
      setShowReceipt(true);

      // Reset form
      setSelectedRoom("");
      setSelectedClient(null);
      setClientSearch("");
      setReservations([]);
      setDiscountType("none");
      setDiscountValue(0);

      onBookingComplete?.();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error("Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Advanced Room Booking</h2>
          <p className="text-muted-foreground">Reserve meeting rooms with flexible scheduling and discounts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Selection
                </CardTitle>
                <CardDescription>Search and select the client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Client</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, code, or phone..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      onFocus={() => setShowClientSearch(true)}
                      className="pl-10"
                    />
                  </div>

                  {/* Client Search Results */}
                  {showClientSearch && clients.length > 0 && (
                    <Card className="max-h-64 overflow-y-auto">
                      <CardContent className="p-2">
                        {clients.map(client => (
                          <button
                            key={client.id}
                            onClick={() => {
                              setSelectedClient(client);
                              setClientSearch(client.full_name);
                              setShowClientSearch(false);
                            }}
                            className="w-full text-left p-3 hover:bg-accent rounded-lg transition-colors"
                          >
                            <div className="font-medium">{client.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {client.client_code} • {client.phone}
                            </div>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Selected Client Display */}
                  {selectedClient && (
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{selectedClient.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {selectedClient.client_code} • {selectedClient.email}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(null);
                            setClientSearch("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Room Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Room Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} - {formatCurrency(room.hourly_rate)}/hr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Add Reservation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Add Reservation Slots
                </CardTitle>
                <CardDescription>Add multiple dates and times for the booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !currentDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {currentDate ? format(currentDate, "PP") : <span>Date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={currentDate}
                          onSelect={setCurrentDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={currentStartTime}
                      onChange={(e) => setCurrentStartTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={currentEndTime}
                      onChange={(e) => setCurrentEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={addReservation} 
                  className="w-full"
                  disabled={!selectedRoom || !currentDate || !currentStartTime || !currentEndTime}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reservation
                </Button>

                {/* Reservations List */}
                {reservations.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    <Label>Added Reservations</Label>
                    <div className="space-y-2">
                      {reservations.map(reservation => (
                        <div key={reservation.id} className="p-3 border rounded-lg bg-muted/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{format(reservation.date, 'PPP')}</div>
                              <div className="text-sm text-muted-foreground">
                                {reservation.startTime} - {reservation.endTime} ({reservation.duration.toFixed(1)}h)
                              </div>
                              <div className="text-sm font-semibold text-primary mt-1">
                                {formatCurrency(reservation.amount)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeReservation(reservation.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discount */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Discount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select value={discountType} onValueChange={(value: any) => setDiscountType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Discount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {discountType !== "none" && (
                    <div className="space-y-2">
                      <Label>
                        {discountType === "percentage" ? "Percentage (%)" : "Amount (EGP)"}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max={discountType === "percentage" ? "100" : undefined}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Room Details */}
            {selectedRoomData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedRoomData.name}</CardTitle>
                  <CardDescription>{selectedRoomData.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium">{selectedRoomData.capacity} people</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-semibold text-primary">
                      {formatCurrency(selectedRoomData.hourly_rate)}/hour
                    </span>
                  </div>
                  {selectedRoomData.amenities && selectedRoomData.amenities.length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Amenities:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedRoomData.amenities.map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Booking Summary */}
            {reservations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ReceiptIcon className="h-5 w-5" />
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reservations:</span>
                      <span className="font-medium">{reservations.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Hours:</span>
                      <span className="font-medium">{getTotalHours().toFixed(1)}h</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    {discountType !== "none" && calculateDiscount() > 0 && (
                      <div className="flex justify-between text-sm text-success">
                        <span>Discount:</span>
                        <span>-{formatCurrency(calculateDiscount())}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleBooking}
                    disabled={loading || !selectedClient}
                  >
                    {loading ? "Processing..." : "Complete Booking"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Receipt</DialogTitle>
            <DialogDescription>
              Room booking completed successfully
            </DialogDescription>
          </DialogHeader>
          {receiptData && (
            <div className="space-y-4">
              <Receipt
                receiptNumber={receiptData.receiptNumber}
                customerName={receiptData.customerName}
                customerEmail={receiptData.customerEmail}
                userId={receiptData.userId}
                items={receiptData.items}
                subtotal={receiptData.subtotal}
                discount={receiptData.discount}
                total={receiptData.total}
                paymentMethod={receiptData.paymentMethod}
                date={receiptData.date}
              />
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Room:</span>
                  <span className="font-medium">{receiptData.roomName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Hours:</span>
                  <span className="font-medium">{receiptData.totalHours.toFixed(1)} hours</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowReceipt(false)}>Close</Button>
            <Button variant="outline" onClick={() => window.print()}>
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoomBooking;
