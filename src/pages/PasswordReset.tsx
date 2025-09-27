import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const PasswordReset = () => {
  const [phone, setPhone] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('generate_reset_token', {
        p_phone: phone
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast({
          title: "Reset Code Sent",
          description: `Reset code: ${result.token} (expires in 15 minutes)`,
        });
        setStep("reset");
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate reset code",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error", 
        description: "Password must be at least 8 characters",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('auth-helpers', {
        body: { phone, newPassword, resetCode: resetToken }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Password reset successfully! You can now login with your new password.",
        });
        
        // Reset form
        setPhone("");
        setResetToken("");
        setNewPassword("");
        setConfirmPassword("");
        setStep("request");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reset password",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Password Reset</CardTitle>
          <CardDescription>
            {step === "request" ? "Enter your phone number to get a reset code" : "Enter the reset code and new password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "request" ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Reset Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="6-digit reset code"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="New password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep("request")} className="flex-1">
                  Back
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Reset Password
                </Button>
              </div>
            </form>
          )}
          
          <div className="mt-4 text-center">
            <a href="/client-login" className="text-sm text-blue-600 hover:text-blue-700">
              Back to Login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordReset;