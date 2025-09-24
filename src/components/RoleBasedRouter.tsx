import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RoleBasedRouterProps {
  children: React.ReactNode;
}

const RoleBasedRouter = ({ children }: RoleBasedRouterProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error);
          toast({
            title: "Error",
            description: "Could not fetch user role",
            variant: "destructive",
          });
          return;
        }

        setUserRole(profile.role);
        
        // Route user to appropriate dashboard based on role
        const currentPath = window.location.pathname;
        const roleRoutes = {
          'client': '/client',
          'receptionist': '/receptionist',
          'barista': '/barista',
          'community_manager': '/community',
          'operations_manager': '/operations',
          'finance_manager': '/operations', // Finance managers use operations dashboard
          'ceo': '/ceo',
          'admin': '/admin-panel'
        };

        const targetRoute = roleRoutes[profile.role as keyof typeof roleRoutes] || '/client';
        
        // Only redirect if user is on the wrong dashboard
        if (currentPath !== targetRoute && !currentPath.includes('/account-settings')) {
          navigate(targetRoute);
        }
      } catch (error) {
        console.error("Error in role-based routing:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRouter;