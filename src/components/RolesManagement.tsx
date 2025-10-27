import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCog, Shield, Search, Plus, Edit, Trash2, Crown, Key, UserPlus } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  phone: string | null;
  created_at: string;
  is_admin: boolean;
}

const ROLE_OPTIONS = [
  { value: "client", label: "Client", color: "bg-muted" },
  { value: "receptionist", label: "Receptionist", color: "bg-info" },
  { value: "barista", label: "Barista", color: "bg-accent" },
  { value: "community_manager", label: "Community Manager", color: "bg-warning" },
  { value: "operations_manager", label: "Operations Manager", color: "bg-success" },
  { value: "finance_manager", label: "Finance Manager", color: "bg-primary" },
  { value: "ceo", label: "CEO", color: "bg-destructive" },
  { value: "admin", label: "Admin", color: "bg-destructive" }
];

const RolesManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedProfileForPassword, setSelectedProfileForPassword] = useState<Profile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [profiles, searchTerm, selectedRole]);

  const fetchProfiles = async () => {
    try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Map data to ensure all Profile properties exist
        const mappedProfiles: Profile[] = (data || []).map((profile: any) => ({
          ...profile,
          is_admin: profile.is_admin ?? false
        }));
        
        setProfiles(mappedProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProfiles = () => {
    let filtered = profiles;

    if (searchTerm) {
      filtered = filtered.filter(profile =>
        profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRole && selectedRole !== "all") {
      filtered = filtered.filter(profile => profile.role === selectedRole);
    }

    setFilteredProfiles(filtered);
  };

  const updateUserRole = async (userId: string, newRole: string, isAdmin: boolean) => {
    try {
      const isStaffRole = ['admin', 'ceo', 'operations_manager', 'finance_manager', 'community_manager', 'receptionist', 'barista'].includes(newRole);
      const adminStatus = isAdmin || newRole === 'admin' || newRole === 'ceo';

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          is_admin: adminStatus
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Synchronize admin_users table
      if (isStaffRole) {
        // Get user email from profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', userId)
          .single();

        if (profileData) {
          // Upsert into admin_users
          const { error: adminError } = await supabase
            .from('admin_users')
            .upsert({
              user_id: userId,
              email: profileData.email,
              full_name: profileData.full_name,
              role: newRole,
              is_active: true
            }, {
              onConflict: 'user_id'
            });

          if (adminError) throw adminError;
        }
      } else {
        // If changing to client role, remove from admin_users
        const { error: deleteError } = await supabase
          .from('admin_users')
          .delete()
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
      }

      await fetchProfiles();
      
      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      setIsDialogOpen(false);
      setEditingProfile(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const createNewUser = async (email: string, password: string, fullName: string, role: string, phone: string) => {
    try {
      // Call the Edge Function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email,
          password,
          fullName,
          role,
          phone
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to create user account",
          variant: "destructive",
        });
        return;
      }

      if (!data?.success) {
        toast({
          title: "Error",
          description: data?.error || "Failed to create user account",
          variant: "destructive",
        });
        return;
      }

      await fetchProfiles();
      
      toast({
        title: "Success",
        description: "User account created successfully",
      });

      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user account",
        variant: "destructive",
      });
    }
  };

  const updateUserPassword = async (userId: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setIsPasswordDialogOpen(false);
      setSelectedProfileForPassword(null);
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete user",
          variant: "destructive",
        });
        return;
      }

      if (!data?.success) {
        toast({
          title: "Error",
          description: data?.error || "Failed to delete user",
          variant: "destructive",
        });
        return;
      }

      await fetchProfiles();
      
      toast({
        title: "Success",
        description: `User ${userEmail} deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const getRoleInfo = (role: string) => {
    return ROLE_OPTIONS.find(option => option.value === role) || 
           { value: role, label: role, color: "bg-muted" };
  };

  const getRoleStats = () => {
    const stats = ROLE_OPTIONS.map(role => ({
      ...role,
      count: profiles.filter(p => p.role === role.value).length
    }));
    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Roles Management</h3>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{profiles.length} Total Users</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Role Overview</TabsTrigger>
          <TabsTrigger value="management">User Management</TabsTrigger>
          <TabsTrigger value="create">Create Account</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {getRoleStats().map((role) => (
              <Card key={role.value} className="hover:shadow-card transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-full ${role.color}/10`}>
                      {role.value === 'ceo' || role.value === 'admin' ? (
                        <Crown className={`h-4 w-4 ${role.color.replace('bg-', 'text-')}`} />
                      ) : (
                        <Users className={`h-4 w-4 ${role.color.replace('bg-', 'text-')}`} />
                      )}
                    </div>
                    <Badge variant="outline" className={`${role.color} text-white border-none`}>
                      {role.count}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{role.label}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Profiles ({filteredProfiles.length})</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => {
                      const roleInfo = getRoleInfo(profile.role);
                      return (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {profile.full_name || "No name"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {profile.user_id.slice(0, 8)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{profile.email}</div>
                              {profile.phone && (
                                <div className="text-sm text-muted-foreground">
                                  {profile.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${roleInfo.color} text-white border-none`}>
                              {roleInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {profile.is_admin ? (
                              <Badge variant="destructive">
                                <Crown className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="outline">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(profile.created_at).toLocaleDateString()}
                          </TableCell>
                           <TableCell className="text-right">
                             <div className="flex gap-2 justify-end">
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => {
                                   setEditingProfile(profile);
                                   setIsDialogOpen(true);
                                 }}
                                 className="hover:bg-muted"
                               >
                                 <Edit className="h-4 w-4" />
                               </Button>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => {
                                   setSelectedProfileForPassword(profile);
                                   setIsPasswordDialogOpen(true);
                                 }}
                                 className="hover:bg-muted"
                               >
                                 <Key className="h-4 w-4" />
                               </Button>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => {
                                   if (window.confirm(`Are you sure you want to delete ${profile.full_name || profile.email}? This action cannot be undone.`)) {
                                     deleteUser(profile.user_id, profile.email);
                                   }
                                 }}
                                 className="hover:bg-destructive/10 hover:text-destructive"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </div>
                           </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create New User Account
              </CardTitle>
              <CardDescription>Create a new user account with role-based portal access</CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const email = formData.get('email') as string;
                  const password = formData.get('password') as string;
                  const fullName = formData.get('fullName') as string;
                  const role = formData.get('role') as string;
                  const phone = formData.get('phone') as string;
                  createNewUser(email, password, fullName, role, phone);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User Account
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update the role and permissions for {editingProfile?.full_name || editingProfile?.email}
            </DialogDescription>
          </DialogHeader>
          
          {editingProfile && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newRole = formData.get('role') as string;
                const isAdmin = formData.get('is_admin') === 'on';
                updateUserRole(editingProfile.user_id, newRole, isAdmin);
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue={editingProfile.role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_admin"
                  name="is_admin"
                  defaultChecked={editingProfile.is_admin}
                  className="rounded border-input"
                />
                <Label htmlFor="is_admin">Admin privileges</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update Role
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Update Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>
              Update the password for {selectedProfileForPassword?.full_name || selectedProfileForPassword?.email}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProfileForPassword && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newPassword = formData.get('password') as string;
                updateUserPassword(selectedProfileForPassword.user_id, newPassword);
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Update Password
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesManagement;