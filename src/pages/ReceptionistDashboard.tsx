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
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State declarations
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSessions, setActiveSessions] = useState<any[]>([
    {
      id: "session_1",
      client_id: "1",
      checked_in_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      client: {
        id: "1",
        full_name: "Ahmed Hassan",
        client_code: "CL001",
        email: "ahmed.hassan@example.com",
        phone: "+20 100 123 4567"
      }
    },
    {
      id: "session_2", 
      client_id: "2",
      checked_in_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      client: {
        id: "2",
        full_name: "Fatima Ibrahim",
        client_code: "CL004",
        email: "fatima.ibrahim@example.com",
        phone: "+20 103 456 7890"
      }
    },
    {
      id: "session_3",
      client_id: "3", 
      checked_in_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      client: {
        id: "3",
        full_name: "Omar Ali",
        client_code: "CL003",
        email: "omar.ali@example.com",
        phone: "+20 102 345 6789"
      }
    }
  ]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [newRegistrationsCount, setNewRegistrationsCount] = useState<number>(3);

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
    // Mock data is already set in state, no backend calls needed
    console.log('Dashboard loaded with mock data');
  }, []);

  const handleCheckOut = (sessionId: string, clientData: any) => {
    // Remove session from active sessions
    setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
    
    setShowReceipt(true);
    
    toast({
      title: "Success",
      description: `${clientData.client?.full_name || 'Client'} checked out successfully`,
    });
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