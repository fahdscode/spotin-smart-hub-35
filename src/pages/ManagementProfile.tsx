import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Briefcase, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SpotinHeader from "@/components/SpotinHeader";
import { Skeleton } from "@/components/ui/skeleton";

const ManagementProfile = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/management-login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Employee Profile</CardTitle>
            <CardDescription>Your account information and role details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-semibold">{profile?.full_name || 'Employee'}</h3>
                <p className="text-muted-foreground capitalize">{userRole || 'Role not assigned'}</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email || 'Not available'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">{userRole || 'Not assigned'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagementProfile;
