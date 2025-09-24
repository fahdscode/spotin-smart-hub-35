import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, User, Phone, Lock, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Form validation schema
const signupSchema = z.object({
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  email: z.string()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ClientSignup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    try {
      signupSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: {[key: string]: string} = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form first
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Hash password
      const passwordHash = await bcrypt.hash(formData.password, 10);

      // Use the new registration function with proper barcode generation
      const { data: registrationData, error: registrationError } = await supabase.rpc('register_client_with_barcode', {
        p_full_name: formData.fullName,
        p_phone: formData.phone,
        p_email: formData.email || null,
        p_password_hash: passwordHash
      });

      if (registrationError) {
        throw registrationError;
      }

      const result = registrationData as any;
      if (!result.success) {
        if (result.error.includes('phone number') || result.error.includes('email')) {
          toast({
            title: "Account Already Exists",
            description: result.error,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registration Failed",
            description: result.error || "Could not create account. Please try again.",
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      toast({
        title: "Account Created Successfully!",
        description: `Welcome ${formData.fullName}! Your client ID: ${result.client_code}`,
      });

      // Store client info and redirect
      localStorage.setItem('spotinClientData', JSON.stringify({
        id: result.client_id,
        clientCode: result.client_code,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email || '',
        barcode: result.barcode
      }));

      setTimeout(() => {
        navigate("/client");
      }, 1500);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  // Real-time validation handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear errors for this field on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
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
                   className={`h-12 rounded-xl border-2 transition-colors ${
                     errors.fullName 
                       ? 'border-red-500 focus:border-red-500' 
                       : 'border-gray-200 focus:border-green-500'
                   }`}
                   required
                 />
                 {errors.fullName && (
                   <div className="flex items-center gap-2 text-red-600 text-sm">
                     <AlertCircle className="h-4 w-4" />
                     {errors.fullName}
                   </div>
                 )}
               </div>
               
               <div className="space-y-2">
                 <Input
                   type="tel"
                   placeholder="Phone Number * (e.g., 1234567890)"
                   value={formData.phone}
                   onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                   className={`h-12 rounded-xl border-2 transition-colors ${
                     errors.phone 
                       ? 'border-red-500 focus:border-red-500' 
                       : 'border-gray-200 focus:border-green-500'
                   }`}
                   required
                 />
                 {errors.phone && (
                   <div className="flex items-center gap-2 text-red-600 text-sm">
                     <AlertCircle className="h-4 w-4" />
                     {errors.phone}
                   </div>
                 )}
               </div>

               <div className="space-y-2">
                 <Input
                   type="email"
                   placeholder="Email (optional)"
                   value={formData.email}
                   onChange={(e) => handleInputChange('email', e.target.value)}
                   className={`h-12 rounded-xl border-2 transition-colors ${
                     errors.email 
                       ? 'border-red-500 focus:border-red-500' 
                       : 'border-gray-200 focus:border-green-500'
                   }`}
                 />
                 {errors.email && (
                   <div className="flex items-center gap-2 text-red-600 text-sm">
                     <AlertCircle className="h-4 w-4" />
                     {errors.email}
                   </div>
                 )}
               </div>

               <div className="space-y-2">
                 <Input
                   type="password"
                   placeholder="Password * (min 8 chars, uppercase, lowercase, number)"
                   value={formData.password}
                   onChange={(e) => handleInputChange('password', e.target.value)}
                   className={`h-12 rounded-xl border-2 transition-colors ${
                     errors.password 
                       ? 'border-red-500 focus:border-red-500' 
                       : 'border-gray-200 focus:border-green-500'
                   }`}
                   required
                 />
                 {errors.password && (
                   <div className="flex items-center gap-2 text-red-600 text-sm">
                     <AlertCircle className="h-4 w-4" />
                     {errors.password}
                   </div>
                 )}
               </div>

               <div className="space-y-2">
                 <Input
                   type="password"
                   placeholder="Confirm Password *"
                   value={formData.confirmPassword}
                   onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                   className={`h-12 rounded-xl border-2 transition-colors ${
                     errors.confirmPassword 
                       ? 'border-red-500 focus:border-red-500' 
                       : 'border-gray-200 focus:border-green-500'
                   }`}
                   required
                 />
                 {errors.confirmPassword && (
                   <div className="flex items-center gap-2 text-red-600 text-sm">
                     <AlertCircle className="h-4 w-4" />
                     {errors.confirmPassword}
                   </div>
                 )}
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
                Your unique client ID and barcode will be generated automatically
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