import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft } from "lucide-react";

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simple admin check - in production this would be more secure
      if (formData.email === "admin@spotin.com" && formData.password === "admin123") {
        // Store admin session
        sessionStorage.setItem("adminSession", "true");
        
        toast({
          title: "Admin Login Successful",
          description: "Welcome to the admin control panel.",
        });
        navigate("/admin-panel");
      } else {
        throw new Error("Invalid admin credentials");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-destructive/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Back Button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Admin Logo */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-8 w-8 text-destructive" />
            <h1 className="text-3xl font-bold text-foreground">Admin Portal</h1>
          </div>
          <p className="text-muted-foreground">Secure access for administrators</p>
        </div>

        {/* Login Card */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Administrator Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="Enter admin email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-password">Admin Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Enter admin password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading} variant="destructive">
                {loading ? (
                  "Authenticating..."
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Login
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <p><strong>Demo Credentials:</strong></p>
              <p>Email: admin@spotin.com</p>
              <p>Password: admin123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;