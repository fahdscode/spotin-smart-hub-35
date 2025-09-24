import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Shield, Search, Users, LogOut, QrCode, RefreshCw } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  barcode: string;
  role: string;
  created_at: string;
}

const AdminPanel = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check admin session
    const adminSession = sessionStorage.getItem("adminSession");
    if (!adminSession) {
      navigate("/admin-login");
      return;
    }

    fetchProfiles();
  }, [navigate]);

  useEffect(() => {
    // Filter profiles based on search term
    if (!searchTerm) {
      setFilteredProfiles(profiles);
    } else {
      const filtered = profiles.filter(profile =>
        profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProfiles(filtered);
    }
  }, [searchTerm, profiles]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch user profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminSession");
    navigate("/admin-login");
  };

  const resetUserPassword = async (userId: string, email: string) => {
    try {
      // In a real app, this would trigger a password reset email
      toast({
        title: "Password Reset",
        description: `Password reset email would be sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}`,
      });
      
      // Refresh the profiles list
      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'client': 'bg-blue-100 text-blue-800',
      'receptionist': 'bg-green-100 text-green-800',
      'barista': 'bg-orange-100 text-orange-800',
      'community_manager': 'bg-purple-100 text-purple-800',
      'operations_manager': 'bg-indigo-100 text-indigo-800',
      'finance_manager': 'bg-yellow-100 text-yellow-800',
      'ceo': 'bg-red-100 text-red-800',
      'admin': 'bg-gray-100 text-gray-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-destructive" />
            <h1 className="text-xl font-bold">Admin Control Panel</h1>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Barcodes</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profiles.filter(p => p.barcode).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant="default">Online</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <Button onClick={fetchProfiles} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading users...</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "No users found matching your search" : "No users found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProfiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">
                            {profile.full_name || "No name"}
                          </TableCell>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(profile.role || 'client')}>
                              {(profile.role || 'client').replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{profile.phone || "No phone"}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {profile.barcode}
                            </code>
                          </TableCell>
                          <TableCell>{formatDate(profile.created_at)}</TableCell>
                          <TableCell className="space-x-2">
                            <select
                              value={profile.role || 'client'}
                              onChange={(e) => updateUserRole(profile.user_id, e.target.value)}
                              className="text-xs border rounded px-2 py-1 bg-background"
                            >
                              <option value="client">Client</option>
                              <option value="receptionist">Receptionist</option>
                              <option value="barista">Barista</option>
                              <option value="community_manager">Community Manager</option>
                              <option value="operations_manager">Operations Manager</option>
                              <option value="finance_manager">Finance Manager</option>
                              <option value="ceo">CEO</option>
                              <option value="admin">Admin</option>
                            </select>
                            <Button
                              onClick={() => resetUserPassword(profile.user_id, profile.email)}
                              variant="outline"
                              size="sm"
                            >
                              Reset Password
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;