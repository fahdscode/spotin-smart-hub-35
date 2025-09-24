import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Coffee, Calendar, Settings, QrCode, User } from "lucide-react";
import QRCode from "qrcode";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  barcode: string;
}

const ClientPortal = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/");
        return;
      }

      // Fetch user profile
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
        return;
      }

      setProfile(profileData);

      // Generate QR code for the barcode
      if (profileData?.barcode) {
        try {
          const qrDataURL = await QRCode.toDataURL(profileData.barcode);
          setQrCodeDataURL(qrDataURL);
        } catch (err) {
          console.error("Error generating QR code:", err);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">SpotIN</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name}!
          </h2>
          <p className="text-muted-foreground">
            Your personal SpotIN portal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                Your Check-in Code
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {qrCodeDataURL && (
                <div className="flex justify-center">
                  <img 
                    src={qrCodeDataURL} 
                    alt="QR Code" 
                    className="w-48 h-48 rounded-lg border"
                  />
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                <p>Barcode: <span className="font-mono">{profile?.barcode}</span></p>
                <p className="mt-2">Show this code at reception for check-in</p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-foreground">{profile?.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-foreground">{profile?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-foreground">{profile?.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button variant="outline" className="h-16 flex-col space-y-2" disabled>
                  <Coffee className="h-6 w-6" />
                  <span>Order Drinks</span>
                  <span className="text-xs text-muted-foreground">(Coming Soon)</span>
                </Button>
                
                <Button variant="outline" className="h-16 flex-col space-y-2" disabled>
                  <Calendar className="h-6 w-6" />
                  <span>View Events</span>
                  <span className="text-xs text-muted-foreground">(Coming Soon)</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-16 flex-col space-y-2"
                  onClick={() => navigate("/account-settings")}
                >
                  <Settings className="h-6 w-6" />
                  <span>Account Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;