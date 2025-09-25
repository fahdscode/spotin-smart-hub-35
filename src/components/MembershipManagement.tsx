import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Crown, Star, Gift, Search } from "lucide-react";

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
  end_date?: string;
  is_active: boolean;
  total_savings: number;
  created_at: string;
}

const MembershipManagement = () => {
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<ClientMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMemberships = async () => {
    try {
      const { data, error } = await supabase.rpc('get_client_memberships');

      if (error) throw error;

      setMemberships(data as unknown as ClientMembership[] || []);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      toast({
        title: "Error",
        description: "Failed to fetch memberships",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return <Users className="h-4 w-4" />;
      case 'premium':
        return <Star className="h-4 w-4" />;
      case 'vip':
        return <Crown className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return 'bg-blue-500';
      case 'premium':
        return 'bg-purple-500';
      case 'vip':
        return 'bg-gold-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredMemberships = memberships.filter(membership =>
    membership.client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    membership.client.client_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    membership.plan_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Memberships</CardTitle>
          <CardDescription>Loading memberships...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Client Memberships
        </CardTitle>
        <CardDescription>
          Manage client membership plans and track benefits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by client name, code, or plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-2xl font-bold">{memberships.length}</div>
              <div className="text-sm text-muted-foreground">Total Memberships</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {memberships.filter(m => m.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Memberships</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-2xl font-bold">
                ${memberships.reduce((sum, m) => sum + Number(m.total_savings), 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Savings</div>
            </div>
          </div>

          {/* Memberships List */}
          <div className="space-y-3">
            {filteredMemberships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No memberships match your search.' : 'No memberships found.'}
              </div>
            ) : (
              filteredMemberships.map((membership) => (
                <div key={membership.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{membership.client.full_name}</h3>
                        <Badge variant="outline">{membership.client.client_code}</Badge>
                        <Badge 
                          variant={membership.is_active ? "default" : "secondary"}
                          className={membership.is_active ? getPlanColor(membership.plan_name) : ""}
                        >
                          <div className="flex items-center gap-1">
                            {getPlanIcon(membership.plan_name)}
                            {membership.plan_name}
                          </div>
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {membership.client.phone} • {membership.client.email}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        {membership.discount_percentage}% OFF
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Saved: ${Number(membership.total_savings).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {membership.perks && membership.perks.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {membership.perks.map((perk, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {perk}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      Started: {new Date(membership.start_date).toLocaleDateString()}
                      {membership.end_date && (
                        <span> • Expires: {new Date(membership.end_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    <Badge variant={membership.is_active ? "default" : "secondary"}>
                      {membership.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MembershipManagement;