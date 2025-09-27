import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Users, Shield, Coffee, Calendar, TrendingUp, Package, UserCheck, LogIn, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SpotinHeader from "@/components/SpotinHeader";
import { AuthDebugger } from "@/components/AuthDebugger";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [showAdminSetup, setShowAdminSetup] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showDebugger, setShowDebugger] = useState(false);
  const { isAuthenticated, userRole } = useAuth();

  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const { data, error } = await supabase.rpc('check_admin_exists');

        if (error) {
          console.error('Error checking for admin:', error);
          setShowAdminSetup(true);
        } else {
          setShowAdminSetup(!data);
        }
      } catch (error) {
        console.error('Error checking admin:', error);
        setShowAdminSetup(true);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminExists();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader />
      
      <div className="container mx-auto p-6">
        {/* Debug Toggle - only show if authenticated */}
        {isAuthenticated && (
          <div className="mb-4 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDebugger(!showDebugger)}
            >
              {showDebugger ? "Hide" : "Show"} Auth Debug
            </Button>
          </div>
        )}
        
        {showDebugger && <AuthDebugger />}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            SpotIn Coworking Management
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete coworking space management system with separate portals for clients and staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Client Portal */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-orange-50 hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                <Coffee className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-green-700">Client Portal</CardTitle>
              <CardDescription className="text-green-600">
                Friendly interface for coworking space members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-green-600">
                <li className="flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  Order drinks and snacks
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Book meeting rooms
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Register for events
                </li>
              </ul>
              <Button 
                onClick={() => navigate("/client-login")}
                className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Client Login
              </Button>
            </CardContent>
          </Card>

          {/* Management Portal */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-slate-50 to-blue-50 hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-slate-600 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-blue-700">Management Portal</CardTitle>
              <CardDescription className="text-blue-600">
                Professional dashboard for staff and operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-blue-600">
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Analytics & Reports
                </li>
                <li className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Operations Management
                </li>
                <li className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  CRM & Customer Relations
                </li>
              </ul>
              <Button 
                onClick={() => navigate("/management-login")}
                className="w-full bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 text-white"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Staff Login
              </Button>
            </CardContent>
          </Card>
        </div>

        {!checkingAdmin && showAdminSetup && (
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-destructive/10 to-primary/10 backdrop-blur-sm rounded-lg p-6 max-w-lg mx-auto border border-destructive/20 shadow-lg">
              <Crown className="w-8 h-8 mx-auto mb-3 text-destructive" />
              <h3 className="text-lg font-semibold text-destructive mb-2">System Setup Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No admin accounts found. Create the first super admin to manage the system.
              </p>
              <Button 
                onClick={() => navigate("/super-admin-setup")}
                variant="destructive" 
                className="w-full"
              >
                <Crown className="w-4 h-4 mr-2" />
                Create Super Admin Account
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
