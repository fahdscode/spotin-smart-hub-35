import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, User, Phone, LogIn, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import bcrypt from "bcryptjs";

const ClientLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check for demo account
      if (username === "demo123" && password === "1234") {
        toast({
          title: "Demo Login Successful",
          description: "Welcome to the demo client account!",
        });
        
        localStorage.setItem('spotinClientData', JSON.stringify({
          clientCode: 'C-2025-DEMO01',
          fullName: 'Demo Client',
          phone: 'demo123',
          email: 'demo@spotin.com'
        }));
        
        navigate("/client");
        return;
      }

      // Query the clients table
      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('phone', username)
        .eq('is_active', true)
        .single();

      if (error || !client) {
        toast({
          title: "Login Failed",
          description: "Invalid phone number or password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, client.password_hash);
      
      if (!passwordMatch) {
        toast({
          title: "Login Failed",
          description: "Invalid phone number or password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Login Successful",
        description: `Welcome back, ${client.full_name}!`,
      });

      // Store client data
      localStorage.setItem('spotinClientData', JSON.stringify({
        clientId: client.id,
        clientCode: client.client_code,
        fullName: client.full_name,
        phone: client.phone,
        email: client.email,
        barcode: client.barcode
      }));

      navigate("/client");
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleDemoLogin = () => {
    setUsername("demo123");
    setPassword("1234");
    toast({
      title: "Demo Credentials Loaded",
      description: "Click Login to access the demo account",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Coffee className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to SpotIn</h1>
          <p className="text-gray-600 mt-2">Access your coworking portal</p>
        </div>

        {/* Featured Services */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center space-y-2">
            <Coffee className="h-6 w-6 text-green-600" />
            <span className="text-sm text-gray-600">Order Drinks</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <User className="h-6 w-6 text-orange-600" />
            <span className="text-sm text-gray-600">Book Rooms</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Check className="h-6 w-6 text-yellow-600" />
            <span className="text-sm text-gray-600">Quick Check-in</span>
          </div>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Client Login</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Phone Number"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-500 transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-500 transition-colors"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white font-semibold"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button
                onClick={handleDemoLogin}
                variant="outline"
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <Phone className="h-4 w-4 mr-2" />
                Quick Demo Login
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 text-center space-y-2">
              <a
                href="/client-signup"
                className="text-sm text-green-600 hover:text-green-700 transition-colors font-medium"
              >
                Don't have an account? Sign up →
              </a>
              <br />
              <a
                href="/management-login"
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Staff Portal →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientLogin;