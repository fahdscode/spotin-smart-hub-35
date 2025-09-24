import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, QrCode } from "lucide-react";

const Landing = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@spotin.com',
        password: 'demo123',
      });

      if (error) {
        // If demo user doesn't exist, create it
        const { error: signUpError } = await supabase.auth.signUp({
          email: 'demo@spotin.com',
          password: 'demo123',
          options: {
            data: {
              full_name: 'Demo User',
              phone: '+1-555-DEMO',
            },
            emailRedirectTo: `${window.location.origin}/client`
          }
        });

        if (signUpError) throw signUpError;
        
        // Sign in after signup
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: 'demo@spotin.com',
          password: 'demo123',
        });

        if (loginError) throw loginError;
      }
      
      toast({
        title: "Demo login successful!",
        description: "Welcome to the SpotIN demo experience.",
      });
      navigate("/client");
    } catch (error: any) {
      toast({
        title: "Demo login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRegistration = async () => {
    const quickEmail = `quick${Date.now()}@spotin.com`;
    const quickPassword = 'quick123';
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: quickEmail,
        password: quickPassword,
        options: {
          data: {
            full_name: `User ${Date.now()}`,
            phone: '',
          },
          emailRedirectTo: `${window.location.origin}/client`
        }
      });

      if (error) throw error;

      toast({
        title: "Quick account created!",
        description: "Your account has been created and you're logged in.",
      });
      navigate("/client");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        });
        navigate("/client");
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              phone: formData.phone,
            },
            emailRedirectTo: `${window.location.origin}/client`
          }
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Branding */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <QrCode className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">SpotIN</h1>
          </div>
          <p className="text-muted-foreground">Your digital check-in experience</p>
        </div>

        {/* Demo and Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button 
            onClick={handleDemoLogin} 
            variant="outline" 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Loading..." : "🎯 Try Demo"}
          </Button>
          <Button 
            onClick={handleQuickRegistration} 
            variant="outline" 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Loading..." : "⚡ Quick Start"}
          </Button>
        </div>

        {/* Auth Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required={!isLogin}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required={!isLogin}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    {isLogin ? <LogIn className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    {isLogin ? "Login" : "Create Account"}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Access Link */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin-login")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Admin Access
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;