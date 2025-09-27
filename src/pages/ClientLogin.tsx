import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, User, Phone, LogIn, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import spotinLogo from "@/assets/spotin-logo.png";

// Form validation schema
const loginSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be less than 15 digits").regex(/^\d+$/, "Phone number must contain only digits"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password must be less than 100 characters")
});
const ClientLogin = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    phone?: string;
    password?: string;
  }>({});
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const validateForm = () => {
    try {
      loginSchema.parse({
        phone,
        password
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: {
          phone?: string;
          password?: string;
        } = {};
        error.errors.forEach(err => {
          if (err.path[0] === 'phone') newErrors.phone = err.message;
          if (err.path[0] === 'password') newErrors.password = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form first
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      // Use secure authentication function with rate limiting
      const {
        data: authResult,
        error
      } = await supabase.rpc('authenticate_client_secure', {
        client_phone: phone,
        client_password: password,
        p_ip_address: null
      });
      if (error) {
        console.error('Authentication error:', error);
        toast({
          title: "Login Failed",
          description: "An error occurred. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      const result = authResult as any;
      if (!result.success || !result.client) {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid phone number or password. Please check your credentials and try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Verify password with bcryptjs
      const isPasswordValid = await bcrypt.compare(password, result.client.password_hash);
      if (!isPasswordValid) {
        toast({
          title: "Login Failed",
          description: "Invalid phone number or password. Please check your credentials and try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      toast({
        title: "Login Successful",
        description: `Welcome back, ${result.client.full_name}!`
      });

      // Store client data for auth context
      const clientData = {
        id: result.client.id,
        client_code: result.client.client_code,
        full_name: result.client.full_name,
        phone: result.client.phone,
        email: result.client.email
      };
      
      localStorage.setItem('clientData', JSON.stringify(clientData));
      
      // Force page reload to trigger auth context update
      window.location.href = '/client';
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  // Real-time validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    setPhone(value);
    if (errors.phone) {
      try {
        loginSchema.shape.phone.parse(value);
        setErrors(prev => ({
          ...prev,
          phone: undefined
        }));
      } catch {}
    }
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password) {
      try {
        loginSchema.shape.password.parse(value);
        setErrors(prev => ({
          ...prev,
          password: undefined
        }));
      } catch {}
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-orange-500 rounded-full flex items-center justify-center mb-4 overflow-hidden">
            <img src={spotinLogo} alt="SpotIn Logo" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to SpotIN</h1>
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
                <Input type="tel" placeholder="Phone Number (e.g., 1234567890)" value={phone} onChange={handlePhoneChange} className={`h-12 rounded-xl border-2 transition-colors ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}`} required />
                {errors.phone && <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.phone}
                  </div>}
              </div>
              <div className="space-y-2">
                <Input type="password" placeholder="Password (min 8 characters)" value={password} onChange={handlePasswordChange} className={`h-12 rounded-xl border-2 transition-colors ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}`} required />
                {errors.password && <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password}
                  </div>}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white font-semibold">
                <LogIn className="h-4 w-4 mr-2" />
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200 text-center space-y-2">
              <a href="/client-signup" className="text-sm text-green-600 hover:text-green-700 transition-colors font-medium">
                Don't have an account? Sign up →
              </a>
              <br />
              <a href="/password-reset" className="text-sm text-orange-600 hover:text-orange-700 transition-colors">
                Forgot password? →
              </a>
              <br />
              <a href="/management-login" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                Staff Portal →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default ClientLogin;