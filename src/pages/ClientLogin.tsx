import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Phone, LogIn, Check, AlertCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import bcrypt from "bcryptjs";
import spotinLogo from "@/assets/spotin-logo-main.png";
import LanguageSelector from "@/components/LanguageSelector";
import RTLWrapper from "@/components/RTLWrapper";

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
  const { toast } = useToast();
  const { setClientAuth } = useAuth();
  const { t } = useTranslation();

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

    if (!validateForm()) {
      toast({
        title: t('auth.validationError'),
        description: t('auth.fixErrors'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: authResult, error } = await supabase.rpc('authenticate_client_secure', {
        client_phone: phone,
        client_password: password,
        p_ip_address: null
      });

      if (error) {
        console.error('Authentication error:', error);
        toast({
          title: t('auth.loginError'),
          description: "An error occurred. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const result = authResult as any;

      if (!result.success || !result.client) {
        toast({
          title: t('auth.loginError'),
          description: result.error || "Invalid phone number or password.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, result.client.password_hash);

      if (!isPasswordValid) {
        toast({
          title: t('auth.loginError'),
          description: "Invalid phone number or password.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: t('auth.loginSuccess'),
        description: `${t('dashboard.welcome')}, ${result.client.full_name}!`
      });

      const clientData = {
        id: result.client.id,
        client_code: result.client.client_code,
        full_name: result.client.full_name,
        phone: result.client.phone,
        email: result.client.email,
        barcode: result.client.barcode
      };
      
      setClientAuth(clientData);
      navigate('/client');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: t('common.error'),
        description: "An error occurred during login.",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhone(value);
    if (errors.phone) {
      try {
        loginSchema.shape.phone.parse(value);
        setErrors(prev => ({ ...prev, phone: undefined }));
      } catch {}
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password) {
      try {
        loginSchema.shape.password.parse(value);
        setErrors(prev => ({ ...prev, password: undefined }));
      } catch {}
    }
  };

  return (
    <RTLWrapper>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Language selector */}
          <div className="flex justify-end">
            <LanguageSelector />
          </div>
        
        {/* Logo */}
        <div className="flex justify-center">
          <img src={spotinLogo} alt="SpotIn Logo" className="h-24 w-auto" />
        </div>

        {/* Featured Services */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t('auth.featuredServices')}</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center space-y-2">
            <Coffee className="h-6 w-6 text-primary" />
            <span className="text-sm text-muted-foreground">{t('clientHome.features.drinks')}</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Calendar className="h-6 w-6 text-accent" />
            <span className="text-sm text-muted-foreground">{t('clientHome.features.events')}</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Check className="h-6 w-6 text-success" />
            <span className="text-sm text-muted-foreground">{t('clientHome.features.checkin')}</span>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t('auth.login')}</CardTitle>
            <CardDescription>{t('clientHome.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="tel"
                  placeholder={t('auth.phone')}
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`transition-colors ${errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  required
                />
                {errors.phone && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.phone}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={handlePasswordChange}
                  className={`transition-colors ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  required
                />
                {errors.password && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-hover" size="lg">
                <LogIn className="h-4 w-4 mr-2" />
                {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t text-center space-y-2">
              <a href="/client-signup" className="text-sm text-primary hover:text-primary-hover transition-colors font-medium block">
                {t('auth.dontHaveAccount')}
              </a>
              <br />
              <a href="/password-reset" className="text-sm text-accent hover:text-accent-hover transition-colors">
                {t('auth.forgotPassword')} →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </RTLWrapper>
  );
};

export default ClientLogin;
