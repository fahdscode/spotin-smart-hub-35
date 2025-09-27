import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
const ManagementLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input
      loginSchema.parse({ email, password });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      if (data.user) {
        // Check if user is an admin/staff member
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('is_active', true)
          .single();

        if (adminError || !adminUser) {
          await supabase.auth.signOut();
          toast.error("Access denied. This account does not have management privileges.");
          return;
        }

        // Log successful login
        await supabase.rpc('log_system_event', {
          p_log_level: 'INFO',
          p_event_type: 'STAFF_LOGIN',
          p_message: `Staff member logged in: ${email}`,
          p_metadata: { role: adminUser.role, email }
        });

        toast.success("Welcome back!");
        
        // Navigate based on role
        switch (adminUser.role) {
          case 'admin':
            navigate('/ceo');
            break;
          case 'receptionist':
            navigate('/receptionist');
            break;
          case 'barista':
            navigate('/barista');
            break;
          case 'ceo':
            navigate('/ceo');
            break;
          case 'operations_manager':
            navigate('/operations');
            break;
          case 'community_manager':
            navigate('/community-manager');
            break;
          default:
            navigate('/receptionist');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.name === 'ZodError') {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Login failed. Please check your credentials.");
      }
      
      // Log failed login attempt
      await supabase.rpc('log_system_event', {
        p_log_level: 'WARN',
        p_event_type: 'STAFF_LOGIN_FAILED',
        p_message: `Failed login attempt for: ${email}`,
        p_metadata: { email, error: error.message }
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 rounded-full bg-primary/10">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Management Portal</CardTitle>
            <CardDescription>
              Sign in to access your dashboard
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              variant="professional"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/')}
            >
              Back to Client Portal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default ManagementLogin;