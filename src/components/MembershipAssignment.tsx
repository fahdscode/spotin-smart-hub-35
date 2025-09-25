import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Crown, Star, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  client_code: string;
  full_name: string;
  phone: string;
  email: string;
  active: boolean;
}

interface MembershipPlan {
  id: string;
  plan_name: string;
  discount_percentage: number;
  perks: string[];
}

const MembershipAssignment = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const membershipPlans: MembershipPlan[] = [
    {
      id: 'basic',
      plan_name: 'Basic Membership',
      discount_percentage: 10,
      perks: ['10% off drinks', 'Priority seating', 'Monthly newsletter']
    },
    {
      id: 'premium',
      plan_name: 'Premium Membership',
      discount_percentage: 20,
      perks: ['20% off drinks', 'Free 2 hours room booking/month', 'Event priority access', 'Free guest passes']
    },
    {
      id: 'vip',
      plan_name: 'VIP Membership',
      discount_percentage: 30,
      perks: ['30% off everything', 'Unlimited room access', 'Personal concierge', 'Exclusive events']
    }
  ];

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, client_code, full_name, phone, email, active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
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
      
      const { data, error } = await supabase
        .from('memberships')
        .insert([
          {
            user_id: selectedClient.id,
            plan_name: selectedPlanData?.plan_name || '',
            discount_percentage: selectedPlanData?.discount_percentage || 0,
            perks: selectedPlanData?.perks || [],
            total_savings: 0,
            is_active: true
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedPlanData?.plan_name} assigned to ${selectedClient.full_name}`,
        variant: "default",
      });

      setSelectedClient(null);
      setSelectedPlan('');
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
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{client.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.client_code} • {client.phone}
                          </p>
                        </div>
                        <Badge variant={client.active ? "default" : "secondary"}>
                          {client.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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
                Assign Membership
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipAssignment;