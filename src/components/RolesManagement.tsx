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
import { Users, UserCog, Shield, Search, Plus, Edit, Trash2, Crown } from "lucide-react";

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
      setProfiles(data || []);
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

    if (selectedRole) {
      filtered = filtered.filter(profile => profile.role === selectedRole);
    }

    setFilteredProfiles(filtered);
  };

  const updateUserRole = async (userId: string, newRole: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          is_admin: isAdmin || newRole === 'admin' || newRole === 'ceo'
        })
        .eq('user_id', userId);

      if (error) throw error;

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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Role Overview</TabsTrigger>
          <TabsTrigger value="management">User Management</TabsTrigger>
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
                <SelectItem value="">All Roles</SelectItem>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProfile(profile);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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
    </div>
  );
};

export default RolesManagement;