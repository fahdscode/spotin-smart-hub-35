import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Trash2, History, Calendar, AlertCircle, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpotinHeader from "@/components/SpotinHeader";
import MembershipAssignment from "@/components/MembershipAssignment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ClientMembership {
  id: string;
  client: {
    id: string;
    full_name: string;
    client_code: string;
    phone: string;
    email: string;
  };
  plan_name: string;
  discount_percentage: number;
  perks: string[];
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  total_savings: number;
  created_at: string;
}

interface MembershipHistory {
  id: string;
  client_id: string;
  plan_name: string;
  discount_percentage: number;
  perks: string[];
  assigned_at: string;
  deactivated_at: string | null;
  deactivation_reason: string | null;
  assigned_by_name: string | null;
}

const ReceptionMemberships = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [memberships, setMemberships] = useState<ClientMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [membershipToRemove, setMembershipToRemove] = useState<string | null>(null);
  const [historyClient, setHistoryClient] = useState<ClientMembership | null>(null);
  const [membershipHistory, setMembershipHistory] = useState<MembershipHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchMemberships();

    // Real-time subscription
    const channel = supabase
      .channel('memberships-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'client_memberships' },
        () => {
          console.log('🔔 Membership changed, refreshing...');
          fetchMemberships();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_client_memberships');
      
      if (error) throw error;
      
      setMemberships((data as any) || []);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      toast({
        title: "Error",
        description: "Failed to load memberships",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientHistory = async (clientId: string) => {
    try {
      setLoadingHistory(true);
      
      // For now, fetch all client_memberships history for this client
      const { data: historyData, error: historyError } = await supabase
        .from('client_memberships' as any)
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (historyError) {
        console.error('History error:', historyError);
        throw historyError;
      }
      
      // Map to history format
      const formattedHistory: MembershipHistory[] = (historyData || []).map((item: any) => ({
        id: item.id,
        client_id: item.client_id,
        plan_name: item.plan_name,
        discount_percentage: item.discount_percentage,
        perks: item.perks || [],
        assigned_at: item.created_at,
        deactivated_at: item.is_active ? null : item.updated_at,
        deactivation_reason: item.is_active ? null : 'Membership deactivated',
        assigned_by_name: null
      }));
      
      setMembershipHistory(formattedHistory);
    } catch (error: any) {
      console.error('Error fetching membership history:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load membership history",
        variant: "destructive"
      });
      setMembershipHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRemoveMembership = async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from('client_memberships')
        .update({ is_active: false, end_date: new Date().toISOString().split('T')[0] })
        .eq('id', membershipId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Membership removed successfully"
      });

      fetchMemberships();
      setMembershipToRemove(null);
    } catch (error) {
      console.error('Error removing membership:', error);
      toast({
        title: "Error",
        description: "Failed to remove membership",
        variant: "destructive"
      });
    }
  };

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const filteredMemberships = memberships.filter(membership => {
    const matchesSearch = membership.client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         membership.client.client_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         membership.client.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && membership.is_active && !isExpired(membership.end_date)) ||
                         (statusFilter === "expired" && (!membership.is_active || isExpired(membership.end_date)));
    
    return matchesSearch && matchesStatus;
  });

  const activeMembershipsCount = memberships.filter(m => m.is_active && !isExpired(m.end_date)).length;
  const expiredMembershipsCount = memberships.filter(m => !m.is_active || isExpired(m.end_date)).length;
  const totalSavings = memberships.reduce((sum, m) => sum + Number(m.total_savings), 0);

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/receptionist')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Memberships Management</h2>
            <p className="text-muted-foreground">Track, assign, and manage client memberships</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Memberships</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{activeMembershipsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expired/Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{expiredMembershipsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Client Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalSavings.toFixed(2)} EGP</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="memberships" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="memberships">Current Memberships</TabsTrigger>
            <TabsTrigger value="assign">Assign New</TabsTrigger>
          </TabsList>

          <TabsContent value="memberships" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, code, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Memberships</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="expired">Expired/Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Memberships List */}
            <Card>
              <CardHeader>
                <CardTitle>Client Memberships</CardTitle>
                <CardDescription>
                  {filteredMemberships.length} membership{filteredMemberships.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading memberships...</div>
                ) : filteredMemberships.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No memberships found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMemberships.map((membership) => {
                      const daysRemaining = getDaysRemaining(membership.end_date);
                      const expired = isExpired(membership.end_date);
                      const isActive = membership.is_active && !expired;

                      return (
                        <div key={membership.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{membership.client.full_name}</h3>
                                <Badge variant="secondary">{membership.client.client_code}</Badge>
                                {isActive ? (
                                  <Badge variant="default" className="bg-success text-white">Active</Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    {expired ? 'Expired' : 'Inactive'}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>{membership.client.phone} • {membership.client.email || 'No email'}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setHistoryClient(membership);
                                      fetchClientHistory(membership.client.id);
                                    }}
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                                  <DialogHeader>
                                    <DialogTitle>Membership History</DialogTitle>
                                    <DialogDescription>
                                      {historyClient?.client.full_name} ({historyClient?.client.client_code})
                                    </DialogDescription>
                                  </DialogHeader>
                                  {loadingHistory ? (
                                    <div className="text-center py-8">Loading history...</div>
                                  ) : membershipHistory.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No history found</div>
                                  ) : (
                                    <div className="space-y-3">
                                      {membershipHistory.map((history) => (
                                        <div key={history.id} className="border rounded-lg p-3 space-y-2">
                                          <div className="flex items-center justify-between">
                                            <h4 className="font-semibold">{history.plan_name}</h4>
                                            <Badge variant="secondary">{history.discount_percentage}% Off</Badge>
                                          </div>
                                          <div className="text-sm text-muted-foreground space-y-1">
                                            <p>✅ Assigned: {new Date(history.assigned_at).toLocaleDateString()}</p>
                                            {history.deactivated_at && (
                                              <p>❌ Deactivated: {new Date(history.deactivated_at).toLocaleDateString()}</p>
                                            )}
                                            {history.assigned_by_name && (
                                              <p>👤 By: {history.assigned_by_name}</p>
                                            )}
                                            {history.deactivation_reason && (
                                              <p>📝 Reason: {history.deactivation_reason}</p>
                                            )}
                                          </div>
                                          {history.perks && history.perks.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                              {history.perks.map((perk, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                  {perk}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              {isActive && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setMembershipToRemove(membership.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Plan:</span>
                                <span className="font-semibold">{membership.plan_name}</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Discount:</span>
                                <span className="font-semibold text-success">{membership.discount_percentage}%</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Total Savings:</span>
                                <span className="font-semibold text-primary">{Number(membership.total_savings).toFixed(2)} EGP</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">Start Date:</span>
                                <span className="font-semibold">{new Date(membership.start_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">End Date:</span>
                                <span className="font-semibold">
                                  {membership.end_date ? new Date(membership.end_date).toLocaleDateString() : 'No expiry'}
                                </span>
                              </div>
                              {daysRemaining !== null && (
                                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                  <span className="text-muted-foreground">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    Days Remaining:
                                  </span>
                                  <span className={`font-semibold ${daysRemaining < 7 ? 'text-destructive' : daysRemaining < 30 ? 'text-warning' : 'text-success'}`}>
                                    {daysRemaining > 0 ? daysRemaining : 'Expired'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {membership.perks && membership.perks.length > 0 && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground mb-2">Perks:</p>
                              <div className="flex flex-wrap gap-1">
                                {membership.perks.map((perk, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {perk}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {daysRemaining !== null && daysRemaining > 0 && daysRemaining < 7 && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Membership expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}!
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assign">
            <Card>
              <CardHeader>
                <CardTitle>Assign New Membership</CardTitle>
                <CardDescription>Search for clients and assign membership plans</CardDescription>
              </CardHeader>
              <CardContent>
                <MembershipAssignment />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Remove Membership Confirmation Dialog */}
      <AlertDialog open={!!membershipToRemove} onOpenChange={() => setMembershipToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Membership?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the membership and set the end date to today. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => membershipToRemove && handleRemoveMembership(membershipToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Membership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReceptionMemberships;
