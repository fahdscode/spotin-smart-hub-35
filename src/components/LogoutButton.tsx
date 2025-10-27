import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeClientsCount, setActiveClientsCount] = useState(0);
  const [checkingClients, setCheckingClients] = useState(false);

  const checkActiveClients = async () => {
    setCheckingClients(true);
    try {
      const { data, error } = await supabase
        .rpc('get_receptionist_active_sessions');
      
      if (error) throw error;
      
      // Type guard: ensure data is an array
      const sessions = Array.isArray(data) ? data : [];
      const count = sessions.length;
      setActiveClientsCount(count);
      
      if (count > 0) {
        // Show warning dialog if there are active clients
        setShowConfirmDialog(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking active clients:', error);
      toast.error("Error checking active clients");
      return true; // Allow logout on error
    } finally {
      setCheckingClients(false);
    }
  };

  const handleLogoutClick = async () => {
    const canLogout = await checkActiveClients();
    if (canLogout) {
      performLogout();
    }
  };

  const performLogout = async () => {
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

  const handleConfirmLogout = () => {
    setShowConfirmDialog(false);
    performLogout();
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        className={className} 
        onClick={handleLogoutClick}
        disabled={checkingClients}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {checkingClients ? "Checking..." : "Logout"}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Active Clients Detected</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-foreground">
                There {activeClientsCount === 1 ? 'is' : 'are'} currently <span className="text-destructive">{activeClientsCount}</span> active client{activeClientsCount === 1 ? '' : 's'} checked in.
              </p>
              <p>
                Are you sure you want to end your session? Please ensure all clients are properly checked out before logging out.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Logout Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};