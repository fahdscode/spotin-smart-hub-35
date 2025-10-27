import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, User, Phone, Lock, Check, AlertCircle, Calendar, Users, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import bcrypt from "bcryptjs";
import { z } from "zod";
import spotinLogo from "@/assets/spotin-logo-main.png";
import LanguageSelector from "@/components/LanguageSelector";
import RTLWrapper from "@/components/RTLWrapper";

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
    .max(100, "Job title must be less than 100 characters")
    .optional()
    .or(z.literal("")),
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
  const { setClientAuth } = useAuth();
  const { t } = useTranslation();

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
        title: t('auth.validationError'),
        description: t('auth.fixErrors'),
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
        p_job_title: formData.jobTitle || 'Not specified',
        p_how_did_you_find_us: formData.howDidYouFindUs
      });

      if (registrationError) {
        throw registrationError;
      }

      const result = registrationData as any;
      if (!result.success) {
        if (result.error.includes('phone number') || result.error.includes('email')) {
          toast({
            title: t('auth.signupError'),
            description: result.error,
            variant: "destructive",
          });
        } else {
          toast({
            title: t('auth.signupError'),
            description: result.error || t('auth.signupError'),
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      toast({
        title: t('clientSignup.accountCreated'),
        description: `${t('clientSignup.welcomeMessage')} ${result.full_name}!`,
      });

      // Store client info and redirect using auth context
      const clientData = {
        id: result.client_id,
        client_code: result.client_code,
        full_name: result.full_name,
        phone: formData.phone,
        email: formData.email || '',
        barcode: result.barcode
      };
      
      // Use auth context to set client authentication
      setClientAuth(clientData);
      
      setTimeout(() => {
        navigate("/client");
      }, 1500);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || t('auth.signupError');
      if (errorMessage.includes('unique constraint') || errorMessage.includes('already exists')) {
        toast({
          title: t('auth.signupError'),
          description: t('auth.signupError'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('auth.signupError'),
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
    <RTLWrapper>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6 animate-fade-in">
          {/* Language selector */}
          <div className="flex justify-end">
            <LanguageSelector />
          </div>
          
          {/* Logo and Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <img src={spotinLogo} alt="SpotIn Logo" className="h-20 w-auto" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t('clientSignup.title')}</h1>
            <p className="text-muted-foreground text-base">{t('clientSignup.subtitle')}</p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center space-y-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
              <div className="p-2 rounded-full bg-primary/10">
                <Coffee className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">{t('clientSignup.benefits.orderDrinks')}</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors">
              <div className="p-2 rounded-full bg-accent/10">
                <User className="h-5 w-5 text-accent" />
              </div>
              <span className="text-xs font-medium text-foreground">{t('clientSignup.benefits.bookRooms')}</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-3 rounded-lg bg-success/5 hover:bg-success/10 transition-colors">
              <div className="p-2 rounded-full bg-success/10">
                <Check className="h-5 w-5 text-success" />
              </div>
              <span className="text-xs font-medium text-foreground">{t('clientSignup.benefits.quickCheckin')}</span>
            </div>
          </div>

        {/* Signup Form */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t('clientSignup.createAccount')}</CardTitle>
            <CardDescription>{t('clientSignup.startJourney')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">{t('clientSignup.firstName')}</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder={t('clientSignup.firstName')}
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`h-11 transition-all ${errors.firstName ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}`}
                      />
                      {errors.firstName && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">{t('clientSignup.lastName')}</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder={t('clientSignup.lastName')}
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`h-11 transition-all ${errors.lastName ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}`}
                      />
                      {errors.lastName && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-medium">{t('clientSignup.gender')}</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                        <SelectTrigger className={`h-11 ${errors.gender ? "border-destructive" : ""}`}>
                          <SelectValue placeholder={t('clientSignup.gender')} />
                        </SelectTrigger>
                        <SelectContent className="bg-background border z-50">
                          <SelectItem value="male">{t('clientSignup.male')}</SelectItem>
                          <SelectItem value="female">{t('clientSignup.female')}</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.gender}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthday" className="text-sm font-medium">{t('clientSignup.birthday')}</Label>
                      <Input
                        id="birthday"
                        name="birthday"
                        type="date"
                        value={formData.birthday}
                        onChange={handleInputChange}
                        className={`h-11 ${errors.birthday ? "border-destructive" : ""}`}
                        max={new Date(Date.now() - 16 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      />
                      {errors.birthday && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.birthday}
                        </p>
                      )}
                    </div>
                  </div>
                
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      {t('clientSignup.phoneNumber')}
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder={t('clientSignup.phoneNumber')}
                      value={formData.phone}
                      onChange={(e) => {
                        const cleanedValue = e.target.value.replace(/\D/g, '');
                        handleInputChange({ target: { name: 'phone', value: cleanedValue } } as any);
                      }}
                      className={`h-11 ${errors.phone ? "border-destructive" : ""}`}
                      dir="ltr"
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {t('clientSignup.emailOptional')}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t('clientSignup.emailOptional')}
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`h-11 ${errors.email ? "border-destructive" : ""}`}
                      dir="ltr"
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      {t('clientSignup.password')}
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder={t('clientSignup.password')}
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`h-11 ${errors.password ? "border-destructive" : ""}`}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      {t('clientSignup.confirmPassword')}
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder={t('clientSignup.confirmPassword')}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`h-11 ${errors.confirmPassword ? "border-destructive" : ""}`}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {t('clientSignup.jobTitle')}
                    </Label>
                    <Input
                      id="jobTitle"
                      name="jobTitle"
                      type="text"
                      placeholder={t('clientSignup.jobTitle')}
                      value={formData.jobTitle}
                      onChange={handleInputChange}
                      className={`h-11 ${errors.jobTitle ? "border-destructive" : ""}`}
                    />
                    {errors.jobTitle && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.jobTitle}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-muted/30">
                      <input
                        type="checkbox"
                        id="isStudent"
                        name="isStudent"
                        className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                      />
                      <Label htmlFor="isStudent" className="text-sm font-normal cursor-pointer">{t('clientSignup.isStudent')}</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="howDidYouFindUs" className="text-sm font-medium">{t('clientSignup.howDidYouFindUs')}</Label>
                    <Select value={formData.howDidYouFindUs} onValueChange={(value) => handleSelectChange('howDidYouFindUs', value)}>
                      <SelectTrigger className={`h-11 ${errors.howDidYouFindUs ? "border-destructive" : ""}`}>
                        <SelectValue placeholder={t('clientSignup.howDidYouFindUs')} />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50 max-h-[300px]">
                        <SelectItem value="social_media">{t('clientSignup.findUsOptions.socialMedia')}</SelectItem>
                        <SelectItem value="friend_referral">{t('clientSignup.findUsOptions.friendReferral')}</SelectItem>
                        <SelectItem value="google_search">{t('clientSignup.findUsOptions.googleSearch')}</SelectItem>
                        <SelectItem value="instagram">{t('clientSignup.findUsOptions.instagram')}</SelectItem>
                        <SelectItem value="facebook">{t('clientSignup.findUsOptions.facebook')}</SelectItem>
                        <SelectItem value="linkedin">{t('clientSignup.findUsOptions.linkedin')}</SelectItem>
                        <SelectItem value="walking_by">{t('clientSignup.findUsOptions.walkingBy')}</SelectItem>
                        <SelectItem value="event">{t('clientSignup.findUsOptions.event')}</SelectItem>
                        <SelectItem value="website">{t('clientSignup.findUsOptions.website')}</SelectItem>
                        <SelectItem value="other">{t('clientSignup.findUsOptions.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.howDidYouFindUs && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.howDidYouFindUs}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base bg-primary hover:bg-primary/90 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('auth.signingUp')}
                    </span>
                  ) : (
                    t('clientSignup.createAccount')
                  )}
                </Button>
            </form>

              <div className="mt-6 pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {t('clientSignup.alreadyHaveAccount')}
                </p>
                <a
                  href="/client-login"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors inline-flex items-center gap-1"
                >
                  {t('clientSignup.loginHere')}
                  <span className="text-lg">→</span>
                </a>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </RTLWrapper>
  );
};

export default ClientSignup;