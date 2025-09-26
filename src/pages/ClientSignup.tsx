import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, User, Phone, Lock, Check, AlertCircle, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Form validation schema
const signupSchema = z.object({
  firstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
  lastName: z.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),
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
  confirmPassword: z.string(),
  jobTitle: z.string()
    .min(2, "Job title must be at least 2 characters")
    .max(100, "Job title must be less than 100 characters"),
  howDidYouFindUs: z.string()
    .min(2, "Please tell us how you found us")
    .max(200, "Response must be less than 200 characters"),
  gender: z.string()
    .min(1, "Please select your gender"),
  birthday: z.string()
    .min(1, "Please enter your birthday")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 16 && age <= 100;
    }, "You must be between 16 and 100 years old")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  jobTitle: string;
  howDidYouFindUs: string;
  gender: string;
  birthday: string;
}

const ClientSignup = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    jobTitle: "",
    howDidYouFindUs: "",
    gender: "",
    birthday: ""
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

      // Use the updated registration function with new fields
      const { data: registrationData, error: registrationError } = await supabase.rpc('test_client_registration', {
        p_first_name: formData.firstName,
        p_last_name: formData.lastName,
        p_phone: formData.phone,
        p_email: formData.email || null,
        p_password_hash: passwordHash,
        p_job_title: formData.jobTitle,
        p_how_did_you_find_us: formData.howDidYouFindUs
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
        description: `Welcome ${result.full_name}! Your client ID: ${result.client_code}`,
      });

      // Store client info and redirect
      localStorage.setItem('clientData', JSON.stringify({
        id: result.client_id,
        clientCode: result.client_code,
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: result.full_name,
        phone: formData.phone,
        email: formData.email || '',
        barcode: result.barcode,
        jobTitle: formData.jobTitle,
        howDidYouFindUs: formData.howDidYouFindUs
      }));

      setTimeout(() => {
        navigate("/client");
      }, 1500);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || "Failed to create account. Please try again.";
      if (errorMessage.includes('unique constraint') || errorMessage.includes('already exists')) {
        toast({
          title: "Account Already Exists",
          description: "An account with this phone number or email already exists.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
    
    setIsLoading(false);
  };

  // Real-time validation handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors for this field on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors for this field on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
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
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={errors.firstName ? "border-destructive" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={errors.lastName ? "border-destructive" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                      <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-sm text-destructive mt-1">{errors.gender}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="birthday">Birth Date</Label>
                    <Input
                      id="birthday"
                      name="birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={handleInputChange}
                      className={errors.birthday ? "border-destructive" : ""}
                      max={new Date(Date.now() - 16 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    />
                    {errors.birthday && (
                      <p className="text-sm text-destructive mt-1">{errors.birthday}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g., 1234567890"
                    value={formData.phone}
                    onChange={(e) => {
                      const cleanedValue = e.target.value.replace(/\D/g, '');
                      handleInputChange({ target: { name: 'phone', value: cleanedValue } } as any);
                    }}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min 8 chars, uppercase, lowercase, number"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="jobTitle">Job Title / Student Status</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    placeholder="e.g., Software Engineer, Student, Freelancer"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    className={errors.jobTitle ? "border-destructive" : ""}
                  />
                  {errors.jobTitle && (
                    <p className="text-sm text-destructive mt-1">{errors.jobTitle}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="howDidYouFindUs">How did you find us?</Label>
                  <Select value={formData.howDidYouFindUs} onValueChange={(value) => handleSelectChange('howDidYouFindUs', value)}>
                    <SelectTrigger className={errors.howDidYouFindUs ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select how you found us" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="friend_referral">Friend Referral</SelectItem>
                      <SelectItem value="google_search">Google Search</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="walking_by">Walking By</SelectItem>
                      <SelectItem value="event">Event/Workshop</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.howDidYouFindUs && (
                    <p className="text-sm text-destructive mt-1">{errors.howDidYouFindUs}</p>
                  )}
                </div>
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