import { useNavigate } from "react-router-dom";
import { Users, Shield, Coffee, Calendar, TrendingUp, Package, UserCheck, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SpotinHeader from "@/components/SpotinHeader";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader />
      
      <div className="container mx-auto p-6">
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

        <div className="text-center mt-12 space-y-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Demo Accounts Available</h3>
            <p className="text-sm text-gray-600 mb-4">
              Try the system with pre-configured demo accounts for all roles
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <strong>Client Demo:</strong> clientdemo / 1234
              </div>
              <div>
                <strong>Staff Demo:</strong> Various roles available
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
