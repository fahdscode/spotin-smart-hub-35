import { useState, useEffect } from "react";
import { ArrowLeft, QrCode, Search, Users, Calendar, UserPlus, CheckCircle, XCircle, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import RoomBooking from "@/components/RoomBooking";
import Receipt from "@/components/Receipt";
import BarcodeScanner from "@/components/BarcodeScanner";
import BarcodeDebugger from "@/components/BarcodeDebugger";
import ClientList from "@/components/ClientList";
import MembershipAssignment from '@/components/MembershipAssignment';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from '@/components/ui/badge';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  
  // State declarations
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [newRegistrationsCount, setNewRegistrationsCount] = useState<number>(0);

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
  ];

  useEffect(() => {
    fetchActiveSessions();
    fetchNewRegistrationsCount();
    
    // Set up real-time subscription for active sessions
    const channel = supabase
      .channel('active-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_ins'
        },
        () => {
          fetchActiveSessions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clients'
        },
        () => {
          fetchNewRegistrationsCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients',
          filter: 'active=eq.true'
        },
        () => {
          fetchActiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNewRegistrationsCount = async () => {
    try {
      console.log('Fetching new registrations count...');
      const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      console.log('New registrations count:', count);
      setNewRegistrationsCount(count || 0);
    } catch (error) {
      console.error('Error fetching new registrations count:', error);
      setNewRegistrationsCount(0); // Set to 0 as fallback
    }
  };

  const fetchActiveSessions = async () => {
    try {
      // Query check_ins with client_id instead of user_id
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          id,
          client_id,
          checked_in_at,
          checked_out_at,
          status,
          created_at
        `)
        .eq('status', 'checked_in')
        .order('checked_in_at', { ascending: false });

      if (error) {
        console.error('Error fetching active check-ins:', error);
        throw error;
      }

      // Now get client details for each check-in
      const sessionsWithClientData = [];
      
      for (const session of data || []) {
        try {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id, client_code, full_name, phone, email, barcode')
            .eq('id', session.client_id)
            .eq('is_active', true)
            .single();

          if (!clientError && clientData) {
            sessionsWithClientData.push({
              ...session,
              client: clientData
            });
          }
        } catch (clientError) {
          console.error('Error fetching client data for session:', clientError);
        }
      }

      console.log('Fetched sessions with client data:', sessionsWithClientData);
      setActiveSessions(sessionsWithClientData);
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
      toast.error('Failed to load active sessions');
      setActiveSessions([]);
    }
  };

  const handleCheckOut = async (sessionId: string, clientData: any) => {
    try {
      // Use the unified checkout function
      const { data, error } = await supabase.rpc('checkout_client', {
        p_client_id: clientData.client_id,
        p_checkout_by_user_id: null // Could be set to staff user ID if available
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to check out client');
      }

      setShowReceipt(true);
      
      // Refresh the active sessions
      await fetchActiveSessions();
      
      toast.success(`${clientData.client?.full_name || 'Client'} checked out successfully`);
    } catch (error: any) {
      console.error('Error checking out client:', error);
      toast.error(error.message || 'Failed to check out client');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Receptionist Dashboard</h2>
            <p className="text-muted-foreground">Manage check-ins, bookings, and client accounts</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Active Sessions" value={activeSessions.length.toString()} change={activeSessions.length > 0 ? '+' + activeSessions.length : '0'} icon={Users} variant="success" />
          <MetricCard title="Available Desks" value="12" change="-2" icon={CheckCircle} variant="info" />
          <MetricCard title="Room Bookings" value="8" change="+1" icon={Calendar} variant="default" />
          <MetricCard title="New Registrations" value={(newRegistrationsCount || 0).toString()} change={(newRegistrationsCount || 0) > 0 ? '+' + (newRegistrationsCount || 0) : '0'} icon={UserPlus} variant="success" />
        </div>

        {/* Tabbed Interface for Mobile/Desktop */}
        <div className="space-y-6">
          {/* Quick Actions - Mobile First Grid */}
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
                        <BarcodeScanner />
                      </DialogContent>
                    )}
                    {action.action === "checkout" && (
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Check-Out Scanner</DialogTitle>
                        </DialogHeader>
                        <BarcodeScanner />
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
                    <BarcodeScanner />
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
                              {session.client?.client_code || 'No ID'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {session.client?.email || 'No email'} • {session.client?.phone || 'No phone'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Checked in: {new Date(session.checked_in_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCheckOut(session.id, session)}
                          className="ml-2 shrink-0"
                        >
                          Check Out
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No active sessions</p>
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

          {/* Client List Component */}
          <ClientList />

          {/* Barcode Debugger for Development */}
          <div className="lg:hidden">
            <BarcodeDebugger />
          </div>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          <Receipt 
            customerName="Demo Customer"
            receiptNumber={`RCP-${Date.now()}`}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceptionistDashboard;