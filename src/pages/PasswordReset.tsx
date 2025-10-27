import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import spotinLogo from "@/assets/spotin-logo-main.png";
import RTLWrapper from "@/components/RTLWrapper";
import LanguageSelector from "@/components/LanguageSelector";

const PasswordReset = () => {
  const [phone, setPhone] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phone.length < 11) {
      toast({
        title: t('common.error'),
        description: t('auth.phoneInvalid'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('generate_reset_token', {
        p_phone: phone
      });

      if (error) {
        console.error('Reset token error:', error);
        toast({
          title: t('passwordReset.error'),
          description: t('passwordReset.failedToSendCode'),
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const result = data as any;
      if (result.success) {
        toast({
          title: t('passwordReset.codeSent'),
          description: t('passwordReset.codeSentDesc') + `: ${result.token}`,
        });
        setStep("reset");
      } else {
        toast({
          title: t('passwordReset.error'),
          description: t('passwordReset.failedToSendCode'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Request reset error:', error);
      toast({
        title: t('passwordReset.error'),
        description: t('passwordReset.failedToSendCode'),
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: t('passwordReset.error'),
        description: t('passwordReset.passwordsDontMatch'),
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('passwordReset.error'), 
        description: t('passwordReset.passwordTooShort'),
        variant: "destructive"
      });
      return;
    }

    if (!resetToken || resetToken.length !== 6) {
      toast({
        title: t('passwordReset.error'),
        description: t('passwordReset.codeRequired'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verify the reset token and update password
      const { data, error } = await supabase.rpc('reset_client_password', {
        p_phone: phone,
        p_reset_token: resetToken,
        p_new_password: newPassword
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: t('passwordReset.error'),
          description: t('passwordReset.failedToReset'),
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const result = data as any;
      if (result.success) {
        toast({
          title: t('passwordReset.passwordResetSuccess'),
          description: t('passwordReset.passwordResetSuccessDesc'),
        });
        
        // Navigate to login after successful reset
        setTimeout(() => {
          navigate('/client-login');
        }, 2000);
      } else {
        toast({
          title: t('passwordReset.error'),
          description: t('passwordReset.failedToReset'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Reset error:', error);
      toast({
        title: t('passwordReset.error'),
        description: t('passwordReset.failedToReset'),
        variant: "destructive"
      });
    }
    setIsLoading(false);
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

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              {step === "request" ? t('passwordReset.title') : t('passwordReset.verificationCode')}
            </CardTitle>
            <CardDescription>
              {step === "request" 
                ? t('passwordReset.subtitle')
                : t('passwordReset.enterCode')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "request" ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <Input
                    type="tel"
                    placeholder={t('passwordReset.phoneNumber')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    maxLength={11}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary-hover">
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isLoading ? t('passwordReset.sending') : t('passwordReset.sendCode')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder={t('passwordReset.verificationCode')}
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder={t('passwordReset.newPassword')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder={t('passwordReset.confirmNewPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep("request")} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common.back')}
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1 bg-primary hover:bg-primary-hover">
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isLoading ? t('passwordReset.resetting') : t('passwordReset.resetPassword')}
                  </Button>
                </div>
              </form>
            )}
            
            <div className="mt-4 text-center">
              <a href="/client-login" className="text-sm text-primary hover:text-primary-hover transition-colors">
                {t('passwordReset.backToLogin')}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </RTLWrapper>
  );
};

export default PasswordReset;
