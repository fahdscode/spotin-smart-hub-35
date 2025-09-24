import { useState, useEffect } from "react";
import { ArrowLeft, QrCode, Search, Users, Calendar, UserPlus, CheckCircle, XCircle, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import RoomBooking from "@/components/RoomBooking";
import Receipt from "@/components/Receipt";
import BarcodeScanner from "@/components/BarcodeScanner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);

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
      title: "Create Account", 
      description: "Register new client/company", 
      icon: UserPlus, 
      action: "create",
      variant: "default" as const
    },
  ];

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .eq('status', 'checked_in')
        .order('checked_in_at', { ascending: false });

      if (error) throw error;
      setActiveSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load active sessions');
      // Set mock data for demo purposes
      setActiveSessions([
        {
          id: '1',
          user_id: 'user1',
          checked_in_at: new Date().toISOString(),
          status: 'checked_in',
          profiles: { full_name: 'Demo User', email: 'demo@example.com' }
        }
      ]);
    }
  };

  const handleCheckOut = async (sessionId: string, userId: string) => {
    try {
      // Update check-in to checked out
      const { error } = await supabase
        .from('check_ins')
        .update({ 
          status: 'checked_out', 
          checked_out_at: new Date().toISOString() 
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Show receipt (with mock data since Receipt component is now simplified)
      setShowReceipt(true);
      
      // Refresh sessions
      await fetchActiveSessions();
      
      toast.success('Client checked out successfully');
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Failed to check out client');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader />
      
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
          <MetricCard title="Active Sessions" value="24" change="+3" icon={Users} variant="success" />
          <MetricCard title="Available Desks" value="12" change="-2" icon={CheckCircle} variant="info" />
          <MetricCard title="Room Bookings" value="8" change="+1" icon={Calendar} variant="default" />
          <MetricCard title="New Check-ins" value="15" change="+5" icon={QrCode} variant="success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used receptionist functions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <Dialog key={action.action}>
                      <DialogTrigger asChild>
                        <Card className="hover:shadow-card transition-all duration-200 cursor-pointer group">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-lg ${
                                action.variant === "success" ? "bg-success/10 text-success" :
                                action.variant === "warning" ? "bg-warning/10 text-warning" :
                                action.variant === "info" ? "bg-info/10 text-info" :
                                "bg-primary/10 text-primary"
                              }`}>
                                <action.icon className="h-6 w-6" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{action.title}</h3>
                                <p className="text-sm text-muted-foreground">{action.description}</p>
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
                    </Dialog>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Quick Check-in */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Search</CardTitle>
                <CardDescription>Find client or booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name, email, or booking ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="professional" className="w-full">
                  <QrCode className="h-4 w-4" />
                  Scan QR Code
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Currently checked-in clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeSessions.length > 0 ? (
                    activeSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{session.profiles?.full_name || 'Unknown User'}</p>
                          <p className="text-xs text-muted-foreground">
                            Checked in: {new Date(session.checked_in_at).toLocaleTimeString()}
                          </p>
                          <p className="text-xs text-primary">Status: {session.status}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCheckOut(session.id, session.user_id)}
                        >
                          Check Out
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">No active sessions</p>
                  )}
                </div>
              </CardContent>
            </Card>
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