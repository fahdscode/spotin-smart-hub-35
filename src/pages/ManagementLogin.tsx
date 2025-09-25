import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, BarChart3, Users2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const ManagementLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const demoAccounts = [{
    username: "receptiondemo",
    password: "1234",
    role: "Receptionist",
    path: "/receptionist"
  }, {
    username: "baristademo",
    password: "1234",
    role: "Barista",
    path: "/barista"
  }, {
    username: "operationsdemo",
    password: "1234",
    role: "Operations",
    path: "/operations"
  }, {
    username: "ceodemo",
    password: "1234",
    role: "CEO",
    path: "/ceo"
  }];
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Check demo accounts
    const demoAccount = demoAccounts.find(account => account.username === username && account.password === password);
    if (demoAccount) {
      toast({
        title: `Welcome, ${demoAccount.role}!`,
        description: "Logged into management portal"
      });
      navigate(demoAccount.path);
      return;
    }

    // Simulate login for other accounts
    if (username && password) {
      toast({
        title: "Access Granted",
        description: "Successfully logged into management portal"
      });
      navigate("/receptionist"); // Default to receptionist dashboard
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid credentials",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };
  const handleDemoLogin = (account: typeof demoAccounts[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    toast({
      title: `${account.role} Demo Loaded`,
      description: "Click Login to access dashboard"
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-slate-600 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SpotIN Management Portal</h1>
          <p className="text-gray-600 mt-2">Staff & Operations Dashboard</p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="flex flex-col items-center space-y-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="text-xs text-gray-600">Reception</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            <span className="text-xs text-gray-600">Barista</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Users2 className="h-5 w-5 text-blue-600" />
            <span className="text-xs text-gray-600">Operations</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Building2 className="h-5 w-5 text-slate-600" />
            <span className="text-xs text-gray-600">Admin</span>
          </div>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Staff Login</CardTitle>
            <CardDescription>Access your management dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors" required />
              </div>
              <div className="space-y-2">
                <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors" required />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 text-white font-semibold">
                {isLoading ? "Authenticating..." : "Login"}
              </Button>
            </form>
            
            {/* Demo Accounts */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3 text-center">Quick Demo Access</p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map(account => <Button key={account.username} onClick={() => handleDemoLogin(account)} variant="outline" size="sm" className="h-10 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium">{account.role}</span>
                      <Badge variant="secondary" className="text-xs mt-1">
                        Demo
                      </Badge>
                    </div>
                  </Button>)}
              </div>
            </div>

            <div className="mt-4 text-center">
              <a href="/client-login" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                ← Back to Client Portal
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default ManagementLogin;