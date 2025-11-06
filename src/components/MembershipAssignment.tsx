import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, UserPlus, Crown, Star, Gift, History, AlertTriangle, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useReceiptProcessing } from '@/hooks/useReceiptProcessing';
import { formatPrice } from '@/lib/currency';

interface Client {
  id: string;
  client_code: string;
  full_name: string;
  phone: string;
  email: string;
  active: boolean;
  current_membership?: {
    plan_name: string;
    discount_percentage: number;
  } | null;
}

interface MembershipHistoryItem {
  id: string;
  plan_name: string;
  discount_percentage: number;
  perks: string[];
  assigned_at: string;
  deactivated_at: string | null;
  deactivation_reason: string | null;
  assigned_by_name: string;
  duration_days: number;
}

interface MembershipPlan {
  id: string;
  plan_name: string;
  discount_percentage: number;
  perks: string[];
  price: number;
}

const MembershipAssignment = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [membershipHistory, setMembershipHistory] = useState<MembershipHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const { toast } = useToast();
  const { generateReceiptNumber, createReceipt } = useReceiptProcessing();

  useEffect(() => {
    fetchMembershipPlans();
  }, []);

  const fetchMembershipPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setMembershipPlans(data || []);
    } catch (error) {
      console.error('Error fetching membership plans:', error);
      toast({
        title: "Error",
        description: "Failed to load membership plans",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchClients = async () => {
    if (!searchQuery.trim()) {
      setClients([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_clients_for_membership', {
        search_term: searchQuery.trim()
      });

      if (error) throw error;
      setClients(data as unknown as Client[] || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchClients = async () => {
    if (!searchQuery.trim()) {
      fetchClients();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, client_code, full_name, phone, email, active')
        .eq('is_active', true)
        .or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,client_code.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error searching clients:', error);
      toast({
        title: "Error",
        description: "Failed to search clients",
        variant: "destructive",
      });
    }
  };

  const fetchMembershipHistory = async (clientId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_client_membership_history' as any, {
        p_client_id: clientId
      });

      if (error) throw error;
      setMembershipHistory((data || []) as unknown as MembershipHistoryItem[]);
      setShowHistory(true);
    } catch (error) {
      console.error('Error fetching membership history:', error);
      toast({
        title: "Error",
        description: "Failed to load membership history",
        variant: "destructive",
      });
    }
  };

  const assignMembership = async () => {
    if (!selectedClient || !selectedPlan) {
      toast({
        title: "Error",
        description: "Please select both client and membership plan",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const selectedPlanData = membershipPlans.find(p => p.id === selectedPlan);
      
      const { data, error } = await supabase.rpc('assign_client_membership', {
        p_client_id: selectedClient.id,
        p_plan_name: selectedPlanData?.plan_name || '',
        p_discount_percentage: selectedPlanData?.discount_percentage || 0,
        p_perks: selectedPlanData?.perks || []
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        // Generate receipt for membership
        const receiptNumber = generateReceiptNumber();
        const receipt = {
          receiptNumber,
          customerName: selectedClient.full_name,
          items: [{
            id: selectedPlan,
            name: `${selectedPlanData?.plan_name} Membership`,
            quantity: 1,
            price: selectedPlanData?.price || 0,
            total: selectedPlanData?.price || 0,
            category: 'membership' as const
          }],
          subtotal: selectedPlanData?.price || 0,
          discount: 0,
          total: selectedPlanData?.price || 0,
          paymentMethod: 'cash',
          userId: selectedClient.id
        };

        // Create receipt in database
        await createReceipt(receipt);
        
        // Set receipt data and show print dialog
        setReceiptData(receipt);
        setShowReceipt(true);

        toast({
          title: "Success!",
          description: result.message,
          variant: result.replaced_plan ? "default" : "default",
        });

        // Reset form
        setSelectedClient(null);
        setSelectedPlan('');
        setSearchQuery("");
        setClients([]);
      } else {
        throw new Error(result?.error || 'Failed to assign membership');
      }
    } catch (error) {
      console.error('Error assigning membership:', error);
      toast({
        title: "Error",
        description: "Failed to assign membership",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic': return <Gift className="h-4 w-4" />;
      case 'premium': return <Star className="h-4 w-4" />;
      case 'vip': return <Crown className="h-4 w-4" />;
      default: return <UserPlus className="h-4 w-4" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'basic': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'premium': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'vip': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Membership
          </CardTitle>
          <CardDescription>
            Search for clients and assign them membership plans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client Search */}
          <div className="space-y-2">
            <Label htmlFor="client-search">Search Client</Label>
            <div className="flex gap-2">
              <Input
                id="client-search"
                placeholder="Search by name, phone, or client code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchClients()}
              />
              <Button onClick={searchClients} variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Client List */}
          {clients.length > 0 && (
            <div className="space-y-2">
              <Label>Select Client</Label>
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {clients.map((client) => (
                  <Card
                    key={client.id}
                    className={`cursor-pointer transition-all ${
                      selectedClient?.id === client.id
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{client.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.client_code} • {client.phone}
                          </p>
                          {client.current_membership && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Current: {client.current_membership.plan_name} ({client.current_membership.discount_percentage}% off)
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchMembershipHistory(client.id);
                            }}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Badge variant={client.active ? "default" : "secondary"}>
                            {client.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Warning if client has active membership */}
          {selectedClient?.current_membership && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This client already has an active <strong>{selectedClient.current_membership.plan_name}</strong> membership.
                Assigning a new membership will replace the current one.
              </AlertDescription>
            </Alert>
          )}

          {/* Membership Plan Selection */}
          <div className="space-y-2">
            <Label htmlFor="membership-plan">Membership Plan</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Select a membership plan" />
              </SelectTrigger>
              <SelectContent>
                {membershipPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <div className="flex items-center gap-2">
                      {getPlanIcon(plan.id)}
                      <span>{plan.plan_name} ({plan.discount_percentage}% off)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Plan Details */}
          {selectedPlan && (
            <Card className={getPlanColor(selectedPlan)}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getPlanIcon(selectedPlan)}
                    <h4 className="font-semibold">
                      {membershipPlans.find(p => p.id === selectedPlan)?.plan_name}
                    </h4>
                    <Badge variant="outline">
                      {membershipPlans.find(p => p.id === selectedPlan)?.discount_percentage}% off
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Perks included:</p>
                    <ul className="text-sm space-y-1">
                      {membershipPlans.find(p => p.id === selectedPlan)?.perks.map((perk, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-current rounded-full" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assign Button */}
          <Button
            onClick={assignMembership}
            disabled={!selectedClient || !selectedPlan || loading}
            className="w-full"
          >
            {loading ? (
              "Assigning..."
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                {selectedClient?.current_membership ? 'Replace Membership' : 'Assign Membership'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Membership History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Membership History</DialogTitle>
            <DialogDescription>
              View all membership assignments for this client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {membershipHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No membership history found</p>
            ) : (
              membershipHistory.map((item) => (
                <Card key={item.id} className={item.deactivated_at ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{item.plan_name}</h4>
                          <Badge variant={item.deactivated_at ? "secondary" : "default"}>
                            {item.discount_percentage}% off
                          </Badge>
                          {!item.deactivated_at && (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Assigned: {new Date(item.assigned_at).toLocaleString()}</p>
                          <p>By: {item.assigned_by_name}</p>
                          {item.deactivated_at && (
                            <>
                              <p>Deactivated: {new Date(item.deactivated_at).toLocaleString()}</p>
                              <p>Reason: {item.deactivation_reason}</p>
                            </>
                          )}
                          <p className="font-medium mt-1">
                            Duration: {Math.floor(item.duration_days)} days
                          </p>
                        </div>
                        {item.perks.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.perks.map((perk, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {perk}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Membership Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Membership Receipt</DialogTitle>
            <DialogDescription>
              Receipt for membership assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 print:p-4">
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold">SpotIN</h2>
              <p className="text-sm text-muted-foreground">Membership Receipt</p>
              <p className="text-xs text-muted-foreground mt-1">
                Receipt #: {receiptData?.receiptNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                Date: {new Date().toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{receiptData?.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Client Code:</span>
                <span className="font-medium">{selectedClient?.client_code}</span>
              </div>
            </div>

            <div className="border-t border-b py-3 space-y-2">
              {receiptData?.items.map((item: any) => (
                <div key={item.id} className="flex justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatPrice(item.total)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatPrice(receiptData?.total || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Payment Method:</span>
                <span className="capitalize">{receiptData?.paymentMethod}</span>
              </div>
            </div>

            <div className="flex gap-2 print:hidden">
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button onClick={() => setShowReceipt(false)} variant="outline" className="flex-1">
                Close
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              <p>Thank you for your membership!</p>
              <p>Visit us at spotin.com</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembershipAssignment;