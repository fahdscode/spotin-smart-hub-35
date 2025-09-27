import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Crown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const setupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Full name must be at least 2 characters")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const SuperAdminSetup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input
      setupSchema.parse(formData);

      // Check if admin already exists
      const { data: existingAdmin } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'ceo'])
        .limit(1);

      if (existingAdmin && existingAdmin.length > 0) {
        toast.error("Super admin already exists. Use the normal login process.");
        navigate('/management-login');
        return;
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email.trim(),
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          full_name: formData.fullName,
          role: 'admin'
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with admin role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            role: 'admin',
            is_admin: true
          })
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;

        // Create admin_users entry
        const { error: adminError } = await supabase
          .from('admin_users')
          .insert({
            user_id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: 'admin',
            is_active: true
          });

        if (adminError) throw adminError;

        // Log the super admin creation
        await supabase.rpc('log_system_event', {
          p_log_level: 'INFO',
          p_event_type: 'SUPER_ADMIN_CREATED',
          p_message: `Super admin account created: ${formData.email}`,
          p_metadata: { email: formData.email, full_name: formData.fullName }
        });

        toast.success("Super admin account created successfully!");
        toast.success("You can now use the management login.");
        
        // Redirect to management login
        setTimeout(() => {
          navigate('/management-login');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Super admin setup error:', error);
      
      if (error.name === 'ZodError') {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to create super admin account.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/5 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant border-destructive/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 rounded-full bg-destructive/10">
            <Crown className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-destructive">Super Admin Setup</CardTitle>
            <CardDescription>
              Create the first admin account for system management
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <p className="text-xs text-warning-foreground">
              This setup is only available when no admin users exist
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                placeholder="Enter your full name"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
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
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder="Create a strong password"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                placeholder="Confirm your password"
                required
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              variant="destructive"
            >
              <Shield className="w-4 h-4 mr-2" />
              {isLoading ? "Creating Admin..." : "Create Super Admin"}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/')}
              disabled={isLoading}
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminSetup;