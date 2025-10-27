import { useState, useEffect } from "react";
import { ArrowLeft, QrCode, Search, Users, Calendar, UserPlus, CheckCircle, XCircle, DoorOpen, CalendarDays, Activity, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import RoomBooking from "@/components/RoomBooking";
import Receipt from "@/components/Receipt";
import EditableReceipt from "@/components/EditableReceipt";
import BarcodeScanner from "@/components/BarcodeScanner";
import BarcodeDebugger from "@/components/BarcodeDebugger";
import CheckInTestHelper from "@/components/CheckInTestHelper";
import ClientList from "@/components/ClientList";
import MembershipAssignment from '@/components/MembershipAssignment';
import RoomCalendar from '@/components/RoomCalendar';
import ProductionMonitor from '@/components/ProductionMonitor';
import CashierSession from '@/components/CashierSession';
import { LogoutButton } from '@/components/LogoutButton';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State declarations
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCheckoutConfirmation, setShowCheckoutConfirmation] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [finalReceiptData, setFinalReceiptData] = useState<any>(null);
  const [newRegistrationsCount, setNewRegistrationsCount] = useState<number>(0);
  const [availableDesks, setAvailableDesks] = useState<number>(0);
  const [roomBookings, setRoomBookings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);

  const quickActions = [
    { 
      title: "Check-IN", 
      description: "Scan QR code or search client", 
      icon: QrCode, 
      action: "checkin",
      variant: "success" as const
    },
    { 
      title: "Check-OUT", 
      description: "End session & free up seat", 
      icon: XCircle, 
      action: "checkout",
      variant: "warning" as const
    },
    { 
      title: "Room Booking", 
      description: "Reserve meeting rooms", 
      icon: DoorOpen, 
      action: "booking",
      variant: "info" as const
    },
    { 
      title: "Assign Membership", 
      description: "Assign membership plans", 
      icon: UserPlus, 
      action: "membership",
      variant: "default" as const
    },
    { 
      title: "Room Calendar", 
      description: "View & manage room bookings", 
      icon: CalendarDays, 
      action: "calendar",
      variant: "secondary" as const
    },
    { 
      title: "System Monitor", 
      description: "Production health & metrics", 
      icon: Activity, 
      action: "monitor",
      variant: "info" as const
    },
  ];

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('No authenticated user found:', error.message);
          setCurrentUserId(null);
        } else if (user) {
          console.log('✅ Authenticated user found:', user.id);
          setCurrentUserId(user.id);
        } else {
          console.warn('No user in auth response, using fallback tracking');
          setCurrentUserId(null);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        setCurrentUserId(null);
      }
    };
    
    // Fetch real active sessions from database
    const fetchActiveSessions = async () => {
      try {
        const { data, error } = await supabase.rpc('get_receptionist_active_sessions');
        if (error) throw error;
        
        const sessions = data || [];
        console.log('📊 Active sessions from DB:', sessions);
        
        // Convert to match the expected format
        const formattedSessions = (sessions as any[]).map((session: any) => ({
          id: `session_${session.id}`,
          client_id: session.id,
          checked_in_at: session.check_in_time || new Date().toISOString(),
          client: {
            id: session.id,
            full_name: session.full_name,
            client_code: session.client_code,
            email: session.email,
            phone: session.phone
          }
        }));
        
        setActiveSessions(formattedSessions);
      } catch (error) {
        console.error('Error fetching active sessions:', error);
        setActiveSessions([]);
      }
    };

    // Fetch daily registrations count
    const fetchDailyRegistrations = async () => {
      try {
        const { data, error } = await supabase.rpc('get_receptionist_daily_registrations');
        if (error) throw error;
        setNewRegistrationsCount(data || 0);
      } catch (error) {
        console.error('Error fetching daily registrations:', error);
        setNewRegistrationsCount(0);
      }
    };

    // Fetch room bookings count for today
    const fetchRoomBookings = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('reservations')
          .select('id', { count: 'exact' })
          .gte('start_time', `${today}T00:00:00Z`)
          .lt('start_time', `${today}T23:59:59Z`)
          .eq('status', 'confirmed');
        
        if (error) throw error;
        setRoomBookings(data?.length || 0);
      } catch (error) {
        console.error('Error fetching room bookings:', error);
        setRoomBookings(0);
      }
    };

    const initializeDashboard = async () => {
      setLoading(true);
      await Promise.all([
        getCurrentUser(),
        fetchActiveSessions(),
        fetchDailyRegistrations(),
        fetchRoomBookings()
      ]);
      setLoading(false);
    };

    initializeDashboard();
    
    // Set up real-time subscription for client check-ins/outs
    const channel = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients',
          filter: 'is_active=eq.true'
        },
        (payload) => {
          console.log('🔔 Client status changed:', payload);
          // Refresh active sessions when any client's active status changes
          fetchActiveSessions();
        }
      )
      .subscribe();

    // Refresh data every 30 seconds as backup
    const interval = setInterval(() => {
      fetchActiveSessions();
      fetchDailyRegistrations();
      fetchRoomBookings();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Update available desks when active sessions change
  useEffect(() => {
    const totalDesks = 50; // Assuming total desk capacity
    const occupiedDesks = activeSessions.length;
    setAvailableDesks(Math.max(0, totalDesks - occupiedDesks));
  }, [activeSessions]);

  const handleCheckOut = (sessionId: string, clientData: any) => {
    setSelectedSession({ sessionId, clientData });
    setShowCheckoutConfirmation(true);
  };

  const calculateSessionDuration = (checkedInAt: string) => {
    const checkedInTime = new Date(checkedInAt);
    const currentTime = new Date();
    const durationInHours = Math.ceil((currentTime.getTime() - checkedInTime.getTime()) / (1000 * 60 * 60));
    return Math.max(1, durationInHours); // Minimum 1 hour
  };

  const calculateSessionCost = (duration: number) => {
    return duration * 300; // 300 EGP per hour
  };

  const confirmCheckout = (items: any[], total: number, paymentMethod: string) => {
    // Remove session from active sessions
    setActiveSessions(prev => prev.filter(session => session.id !== selectedSession.sessionId));
    
    // Store receipt data
    setFinalReceiptData({
      customerName: selectedSession.clientData.client?.full_name || 'Client',
      receiptNumber: `RCP-${Date.now()}`,
      items: items,
      total: total,
      paymentMethod: paymentMethod,
      date: new Date().toLocaleDateString()
    });
    
    setShowCheckoutConfirmation(false);
    setShowReceipt(true);
    
    toast({
      title: "Payment Successful",
      description: `${selectedSession.clientData.client?.full_name || 'Client'} checked out successfully`,
    });
  };

  const cancelCheckout = () => {
    setShowCheckoutConfirmation(false);
    setSelectedSession(null);
  };


  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <LogoutButton />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Receptionist Dashboard</h2>
            <p className="text-muted-foreground">Manage check-ins, bookings, and client accounts</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard 
            title="Active Sessions" 
            value={loading ? "..." : activeSessions.length.toString()} 
            change={activeSessions.length > 0 ? '+' + activeSessions.length : '0'} 
            icon={Users} 
            variant="success" 
          />
          <MetricCard 
            title="Available Desks" 
            value={loading ? "..." : availableDesks.toString()} 
            change={activeSessions.length > 0 ? '-' + activeSessions.length : '0'} 
            icon={CheckCircle} 
            variant="info" 
          />
          <MetricCard 
            title="Room Bookings" 
            value={loading ? "..." : roomBookings.toString()} 
            change={roomBookings > 0 ? '+' + roomBookings : '0'} 
            icon={Calendar} 
            variant="default" 
          />
          <MetricCard 
            title="New Registrations" 
            value={loading ? "..." : newRegistrationsCount.toString()} 
            change={newRegistrationsCount > 0 ? '+' + newRegistrationsCount : '0'} 
            icon={UserPlus} 
            variant="success" 
          />
        </div>

        {/* Tabbed Interface for Mobile/Desktop */}
        <Tabs defaultValue="actions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="cashier">
              <DollarSign className="h-4 w-4 mr-2" />
              Cashier Session
            </TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used receptionist functions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action) => (
                    <Dialog key={action.action}>
                      <DialogTrigger asChild>
                        <Card className="hover:shadow-card transition-all duration-200 cursor-pointer group">
                          <CardContent className="p-4">
                            <div className="flex flex-col items-center text-center gap-3">
                              <div className={`p-3 rounded-lg ${
                                action.variant === "success" ? "bg-success/10 text-success" :
                                action.variant === "warning" ? "bg-warning/10 text-warning" :
                                action.variant === "info" ? "bg-info/10 text-info" :
                                "bg-primary/10 text-primary"
                              }`}>
                                <action.icon className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm">{action.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                      {action.action === "checkin" && (
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Check-In Scanner</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            <div className="bg-muted/50 p-3 rounded-md text-sm">
                              <strong>Scanner Status:</strong> User ID: {currentUserId || 'No authenticated user (actions will be tracked as system)'}
                            </div>
                            <CheckInTestHelper />
                            <BarcodeScanner scannedByUserId={currentUserId || undefined} />
                          </div>
                        </DialogContent>
                      )}
                      {action.action === "checkout" && (
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Check-Out Scanner</DialogTitle>
                          </DialogHeader>
                          <BarcodeScanner scannedByUserId={currentUserId || undefined} />
                        </DialogContent>
                      )}
                      {action.action === "booking" && (
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Room Booking System</DialogTitle>
                          </DialogHeader>
                          <RoomBooking />
                        </DialogContent>
                      )}
                      {action.action === "membership" && (
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Assign Membership</DialogTitle>
                            <DialogDescription>
                              Search for clients and assign membership plans
                            </DialogDescription>
                          </DialogHeader>
                          <MembershipAssignment />
                        </DialogContent>
                      )}
                      {action.action === "calendar" && (
                        <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Room Calendar</DialogTitle>
                            <DialogDescription>
                              View and manage room reservations across all spaces
                            </DialogDescription>
                          </DialogHeader>
                          <RoomCalendar />
                        </DialogContent>
                      )}
                      {action.action === "monitor" && (
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Production Monitor</DialogTitle>
                            <DialogDescription>
                              Real-time system health and performance metrics
                            </DialogDescription>
                          </DialogHeader>
                          <ProductionMonitor />
                        </DialogContent>
                      )}
                    </Dialog>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Scanner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Quick Scanner</CardTitle>
                  <CardDescription>Fast check-in/out</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name, email, or client code"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="professional" className="w-full">
                        <QrCode className="h-4 w-4 mr-2" />
                        Scan QR Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle>QR Code Scanner</DialogTitle>
                      </DialogHeader>
                      <BarcodeScanner scannedByUserId={currentUserId || undefined} />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Active Sessions Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Active Sessions Summary</CardTitle>
                  <CardDescription>Currently checked-in clients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {activeSessions.length > 0 ? (
                      activeSessions.slice(0, 5).map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">{session.client?.full_name || 'Unknown Client'}</p>
                              <Badge variant="secondary" className="text-xs">
                                {session.client?.client_code || 'N/A'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{session.client?.email || session.client?.phone || 'No contact'}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckOut(session.id, session)}
                            className="ml-2"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No active sessions</p>
                    )}
                    {activeSessions.length > 5 && (
                      <p className="text-center text-xs text-muted-foreground">
                        +{activeSessions.length - 5} more sessions
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <ClientList />
          </TabsContent>

          <TabsContent value="cashier" className="space-y-6">
            <CashierSession />
          </TabsContent>
        </Tabs>

        {/* Barcode Debugger for Development */}
        <div className="lg:hidden">
          <BarcodeDebugger />
        </div>
      </div>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckoutConfirmation} onOpenChange={setShowCheckoutConfirmation}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Checkout Confirmation</DialogTitle>
            <DialogDescription>
              Review and edit the receipt before processing payment
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <EditableReceipt
              receiptNumber={`RCP-${Date.now()}`}
              customerName={selectedSession.clientData.client?.full_name || 'Client'}
              sessionDuration={calculateSessionDuration(selectedSession.clientData.checked_in_at)}
              sessionCost={calculateSessionCost(calculateSessionDuration(selectedSession.clientData.checked_in_at))}
              onConfirm={confirmCheckout}
              onCancel={cancelCheckout}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Final Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {finalReceiptData ? (
            <Receipt 
              customerName={finalReceiptData.customerName}
              receiptNumber={finalReceiptData.receiptNumber}
              items={finalReceiptData.items}
              total={finalReceiptData.total}
              paymentMethod={finalReceiptData.paymentMethod}
              date={finalReceiptData.date}
            />
          ) : (
            <Receipt 
              customerName="Demo Customer"
              receiptNumber={`RCP-${Date.now()}`}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceptionistDashboard;