import { Clock, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CairoClock from "@/components/CairoClock";
import spotinLogo from "@/assets/spotin-logo.png";
import LanguageSelector from "@/components/LanguageSelector";

interface SpotinHeaderProps {
  showClock?: boolean;
}
const SpotinHeader = ({ showClock = false }: SpotinHeaderProps) => {
  const navigate = useNavigate();
  const { signOut, userRole } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeClientsCount, setActiveClientsCount] = useState(0);

  const checkActiveClients = async () => {
    try {
      const { data, error } = await supabase.rpc('get_receptionist_active_sessions');
      if (error) throw error;

      const sessions = Array.isArray(data) ? data : [];
      const count = sessions.length;
      setActiveClientsCount(count);
      
      if (count > 0) {
        setShowConfirmDialog(true);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking active clients:', error);
      toast.error("Error checking active clients");
      return true;
    }
  };

  const handleSignOut = async () => {
    const canLogout = await checkActiveClients();
    if (canLogout) {
      performLogout();
    }
  };

  const performLogout = async () => {
    try {
      await signOut();
      toast.success("Successfully logged out");
      navigate(userRole === 'client' ? '/client-login' : '/management-login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Error logging out");
    }
  };

  const handleConfirmLogout = () => {
    setShowConfirmDialog(false);
    performLogout();
  };
  
  return <header className="bg-primary text-primary-foreground p-6 shadow-lg">
      <div className="container flex items-center justify-between mx-0 px-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary-foreground/10 p-2 rounded-lg">
            <img src={spotinLogo} alt="SpotIN Logo" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">SpotIN</h1>
            <p className="text-primary-foreground/80 text-sm">The Space of the Future</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {showClock && <CairoClock />}
          
          <LanguageSelector />
          
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-sm">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {userRole === 'client' ? (
                <>
                  <DropdownMenuItem onClick={() => {
                    navigate('/client');
                    // Trigger profile view - we'll use URL hash
                    setTimeout(() => {
                      const event = new CustomEvent('navigate-to-profile');
                      window.dispatchEvent(event);
                    }, 100);
                  }}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/client-settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => navigate('/management-profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/management-settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
    </header>;
};
export default SpotinHeader;