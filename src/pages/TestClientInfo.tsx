import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Coffee } from "lucide-react";
import spotinLogo from "@/assets/spotin-logo.png";

const TestClientInfo = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-orange-500 rounded-full flex items-center justify-center mb-4 overflow-hidden">
            <img src={spotinLogo} alt="SpotIn Logo" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Test Client Login</h1>
          <p className="text-gray-600 mt-2">Demo credentials for testing</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Test Account Credentials</CardTitle>
            <CardDescription>Use these credentials to test the client portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="flex items-center gap-2">
                <Input 
                  value="1111111111" 
                  readOnly 
                  className="bg-gray-50" 
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard("1111111111", "Phone number")}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="flex items-center gap-2">
                <Input 
                  value="testpass123" 
                  readOnly 
                  className="bg-gray-50" 
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard("testpass123", "Password")}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                This test account has full access to all client portal features including:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Order drinks and food</li>
                <li>• Book meeting rooms</li>
                <li>• Check-in/out tracking</li>
                <li>• View order history</li>
                <li>• Register for events</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <Button asChild className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600">
                <a href="/client-login">Go to Login Page</a>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href="/management-login">Staff Portal</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            For production use, remove test accounts and implement proper user registration
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestClientInfo;