import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, User, Phone, Lock, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ClientSignup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const generateBarcode = () => {
    return 'BC' + Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!formData.fullName || !formData.phone || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 4) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 4 characters",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simulate account creation
    const userBarcode = generateBarcode();
    
    toast({
      title: "Account Created Successfully!",
      description: `Welcome ${formData.fullName}! Your barcode: ${userBarcode}`,
    });

    // Simulate delay and redirect to client portal
    setTimeout(() => {
      navigate("/client");
    }, 1500);
    
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Coffee className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Join SpotIn</h1>
          <p className="text-gray-600 mt-2">Create your coworking account</p>
        </div>

        {/* Benefits */}
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

        {/* Signup Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription>Start your coworking journey today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-500 transition-colors"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Input
                  type="tel"
                  placeholder="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email (optional)"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password *"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Confirm Password *"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-500 transition-colors"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white font-semibold"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
            
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Your unique barcode will be generated automatically
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Free to join • Instant access</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center space-y-2">
              <a
                href="/client-login"
                className="text-sm text-green-600 hover:text-green-700 transition-colors font-medium"
              >
                Already have an account? Login →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientSignup;