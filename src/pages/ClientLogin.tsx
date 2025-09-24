import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Users, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ClientLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Demo account check
    if (username === "clientdemo" && password === "1234") {
      toast({
        title: "Welcome to SpotIn!",
        description: "Logged in as demo client",
      });
      navigate("/client");
      return;
    }

    // Simulate login for now
    if (username && password) {
      toast({
        title: "Welcome back!",
        description: "Successfully logged into your client portal",
      });
      navigate("/client");
    } else {
      toast({
        title: "Login failed",
        description: "Please check your credentials",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleDemoLogin = () => {
    setUsername("clientdemo");
    setPassword("1234");
    toast({
      title: "Demo Account Loaded",
      description: "Click Login to continue",
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
          <p className="text-gray-600 mt-2">Your coworking space portal</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center space-y-2">
            <Coffee className="h-6 w-6 text-green-600" />
            <span className="text-sm text-gray-600">Order Drinks</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Users className="h-6 w-6 text-orange-600" />
            <span className="text-sm text-gray-600">Book Rooms</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Wifi className="h-6 w-6 text-yellow-600" />
            <span className="text-sm text-gray-600">Join Events</span>
          </div>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Client Login</CardTitle>
            <CardDescription>Access your personal workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Username"
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
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button
                onClick={handleDemoLogin}
                variant="outline"
                className="w-full h-12 rounded-xl border-2 border-green-500 text-green-600 hover:bg-green-50"
              >
                Quick Demo Login
              </Button>
            </div>

            <div className="mt-4 text-center">
              <a
                href="/management-login"
                className="text-sm text-gray-500 hover:text-green-600 transition-colors"
              >
                Staff? Access Management Portal →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientLogin;