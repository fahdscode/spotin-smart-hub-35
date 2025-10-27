import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}
export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = "outline",
  size = "default",
  className = ""
}) => {
  const {
    signOut,
    userRole
  } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Successfully logged out");

      // Navigate to appropriate login page
      if (userRole === 'client') {
        navigate('/client-login');
      } else {
        navigate('/management-login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Error logging out");
    }
  };
  return (
    <Button variant={variant} size={size} className={className} onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
};