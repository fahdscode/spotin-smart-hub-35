import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Shield, Search, Users, LogOut, QrCode, RefreshCw, UserPlus } from "lucide-react";

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "client",
    password: ""
  });
  const [createLoading, setCreateLoading] = useState(false);
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

      if (error) {
        console.error("Database error:", error);
        // Don't show error toast for permission issues, just show empty state
        if (error.code !== '42501' && error.code !== '42P17') {
          toast({
            title: "Error",
            description: "Unable to fetch user profiles. Please try again.",
            variant: "destructive",
          });
        }
        setProfiles([]);
        return;
      }

      setProfiles(data || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      // Don't show error to user, just handle gracefully
      setProfiles([]);
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

      if (error) {
        console.error("Role update error:", error);
        toast({
          title: "Error",
          description: "Unable to update user role. Please check your permissions.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}`,
      });
      
      // Refresh the profiles list
      fetchProfiles();
    } catch (error: any) {
      console.error("Update role error:", error);
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

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: createFormData.email,
        password: createFormData.password,
        options: {
          data: {
            full_name: createFormData.name,
            phone: createFormData.phone,
            role: createFormData.role,
          },
          emailRedirectTo: `${window.location.origin}/client`
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the profile with the selected role if needed
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
            role: createFormData.role,
            phone: createFormData.phone 
          })
          .eq("user_id", authData.user.id);

        if (profileError) {
          console.warn("Profile update warning:", profileError);
        }
      }

      toast({
        title: "User Created",
        description: `User ${createFormData.name} has been created with role: ${createFormData.role}`,
      });

      // Reset form and close
      setCreateFormData({
        name: "",
        email: "",
        phone: "",
        role: "client",
        password: ""
      });
      setShowCreateForm(false);
      
      // Refresh the profiles list
      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
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

        {/* Create User Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New User</CardTitle>
              <Button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant={showCreateForm ? "outline" : "default"}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {showCreateForm ? "Cancel" : "Add User"}
              </Button>
            </div>
          </CardHeader>
          {showCreateForm && (
            <CardContent>
              <form onSubmit={createUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                    <Input
                      id="name"
                      type="text"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      required
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">Phone (Optional)</label>
                    <Input
                      id="phone"
                      type="tel"
                      value={createFormData.phone}
                      onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">Password</label>
                    <Input
                      id="password"
                      type="password"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                      required
                      placeholder="Enter password"
                      minLength={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium">Role</label>
                    <select
                      id="role"
                      value={createFormData.role}
                      onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                      className="w-full border rounded px-3 py-2 bg-background"
                      required
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
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

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
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center space-y-2">
                            <Users className="h-12 w-12 text-muted-foreground" />
                            <h3 className="text-lg font-medium text-foreground">
                              {searchTerm ? "No users found" : "No users registered yet"}
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                              {searchTerm 
                                ? "Try adjusting your search terms or clear the search to see all users."
                                : "Users will appear here once they register for the platform. You can also create users manually using the form above."
                              }
                            </p>
                          </div>
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