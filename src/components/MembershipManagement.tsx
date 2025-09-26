import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Crown, Star, Gift, Search, Plus, Edit2, Trash2, Settings } from "lucide-react";
import { z } from 'zod';

interface MembershipPlan {
  id: string;
  plan_name: string;
  discount_percentage: number;
  perks: string[];
  price: number;
  duration_months: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

const membershipPlanSchema = z.object({
  plan_name: z.string().trim().min(1, "Plan name is required").max(50, "Plan name must be less than 50 characters"),
  discount_percentage: z.number().min(0, "Discount must be 0 or greater").max(100, "Discount cannot exceed 100%"),
  price: z.number().min(0, "Price must be 0 or greater"),
  duration_months: z.number().min(1, "Duration must be at least 1 month").max(120, "Duration cannot exceed 120 months"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  perks: z.array(z.string().trim().min(1)).min(1, "At least one perk is required")
});

const MembershipManagement = () => {
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<ClientMembership[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    plan_name: "",
    discount_percentage: 0,
    price: 0,
    duration_months: 1,
    description: "",
    perks: [""]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    }
  };

  const fetchMembershipPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMembershipPlans(data || []);
    } catch (error) {
      console.error('Error fetching membership plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch membership plans",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMemberships(), fetchMembershipPlans()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const validateForm = () => {
    try {
      const perksFiltered = formData.perks.filter(perk => perk.trim() !== "");
      membershipPlanSchema.parse({
        ...formData,
        perks: perksFiltered
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const resetForm = () => {
    setFormData({
      plan_name: "",
      discount_percentage: 0,
      price: 0,
      duration_months: 1,
      description: "",
      perks: [""]
    });
    setErrors({});
    setEditingPlan(null);
  };

  const handleCreatePlan = async () => {
    if (!validateForm()) return;

    try {
      const perksFiltered = formData.perks.filter(perk => perk.trim() !== "");
      
      const { error } = await supabase
        .from('membership_plans')
        .insert([{
          plan_name: formData.plan_name.trim(),
          discount_percentage: formData.discount_percentage,
          price: formData.price,
          duration_months: formData.duration_months,
          description: formData.description.trim() || null,
          perks: perksFiltered
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Membership plan created successfully",
      });

      resetForm();
      setIsDialogOpen(false);
      fetchMembershipPlans();
    } catch (error: any) {
      console.error('Error creating plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create membership plan",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePlan = async () => {
    if (!validateForm() || !editingPlan) return;

    try {
      const perksFiltered = formData.perks.filter(perk => perk.trim() !== "");
      
      const { error } = await supabase
        .from('membership_plans')
        .update({
          plan_name: formData.plan_name.trim(),
          discount_percentage: formData.discount_percentage,
          price: formData.price,
          duration_months: formData.duration_months,
          description: formData.description.trim() || null,
          perks: perksFiltered
        })
        .eq('id', editingPlan.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Membership plan updated successfully",
      });

      resetForm();
      setIsDialogOpen(false);
      fetchMembershipPlans();
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update membership plan",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('membership_plans')
        .update({ is_active: false })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Membership plan deactivated successfully",
      });

      fetchMembershipPlans();
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate membership plan",
        variant: "destructive",
      });
    }
  };

  const handleEditPlan = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      discount_percentage: plan.discount_percentage,
      price: plan.price,
      duration_months: plan.duration_months,
      description: plan.description || "",
      perks: plan.perks.length > 0 ? plan.perks : [""]
    });
    setIsDialogOpen(true);
  };

  const addPerkField = () => {
    setFormData(prev => ({
      ...prev,
      perks: [...prev.perks, ""]
    }));
  };

  const removePerkField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index)
    }));
  };

  const updatePerk = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      perks: prev.perks.map((perk, i) => i === index ? value : perk)
    }));
  };

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
    <div className="space-y-6">
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Client Memberships</TabsTrigger>
          <TabsTrigger value="plans">
            <Settings className="h-4 w-4 mr-2" />
            Manage Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client Memberships
              </CardTitle>
              <CardDescription>
                View and manage client membership subscriptions
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
                      {memberships.reduce((sum, m) => sum + Number(m.total_savings), 0).toFixed(2)} EGP
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
                              Saved: {Number(membership.total_savings).toFixed(2)} EGP
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
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Membership Plans Management
                  </CardTitle>
                  <CardDescription>
                    Create, edit, and manage available membership plans
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} variant="professional">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingPlan ? 'Edit Membership Plan' : 'Create New Membership Plan'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingPlan ? 'Update the membership plan details' : 'Create a new membership plan with benefits and pricing'}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="plan_name">Plan Name *</Label>
                          <Input
                            id="plan_name"
                            value={formData.plan_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                            placeholder="e.g., Premium"
                            className={errors.plan_name ? "border-destructive" : ""}
                          />
                          {errors.plan_name && <p className="text-destructive text-sm mt-1">{errors.plan_name}</p>}
                        </div>
                        
                        <div>
                          <Label htmlFor="discount_percentage">Discount Percentage *</Label>
                          <Input
                            id="discount_percentage"
                            type="number"
                            min="0"
                            max="100"
                            value={formData.discount_percentage}
                            onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: parseInt(e.target.value) || 0 }))}
                            className={errors.discount_percentage ? "border-destructive" : ""}
                          />
                          {errors.discount_percentage && <p className="text-destructive text-sm mt-1">{errors.discount_percentage}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price">Monthly Price ($) *</Label>
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            className={errors.price ? "border-destructive" : ""}
                          />
                          {errors.price && <p className="text-destructive text-sm mt-1">{errors.price}</p>}
                        </div>
                        
                        <div>
                          <Label htmlFor="duration_months">Duration (Months) *</Label>
                          <Input
                            id="duration_months"
                            type="number"
                            min="1"
                            max="120"
                            value={formData.duration_months}
                            onChange={(e) => setFormData(prev => ({ ...prev, duration_months: parseInt(e.target.value) || 1 }))}
                            className={errors.duration_months ? "border-destructive" : ""}
                          />
                          {errors.duration_months && <p className="text-destructive text-sm mt-1">{errors.duration_months}</p>}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of the membership plan..."
                          className={errors.description ? "border-destructive" : ""}
                        />
                        {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
                      </div>

                      <div>
                        <Label>Perks & Benefits *</Label>
                        <div className="space-y-2 mt-2">
                          {formData.perks.map((perk, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={perk}
                                onChange={(e) => updatePerk(index, e.target.value)}
                                placeholder={`Perk ${index + 1}`}
                                className="flex-1"
                              />
                              {formData.perks.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removePerkField(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addPerkField}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Perk
                          </Button>
                          {errors.perks && <p className="text-destructive text-sm mt-1">{errors.perks}</p>}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}
                          variant="professional"
                          className="flex-1"
                        >
                          {editingPlan ? 'Update Plan' : 'Create Plan'}
                        </Button>
                        <Button
                          onClick={() => setIsDialogOpen(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading plans...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {membershipPlans.filter(plan => plan.is_active).map((plan) => (
                    <Card key={plan.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPlanIcon(plan.plan_name)}
                            <CardTitle className="text-lg">{plan.plan_name}</CardTitle>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleEditPlan(plan)}
                              size="sm"
                              variant="ghost"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeletePlan(plan.id)}
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {plan.price} EGP/month
                        </div>
                        <Badge variant="secondary" className="w-fit">
                          {plan.discount_percentage}% Discount
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                        )}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Benefits:</div>
                          <div className="space-y-1">
                            {plan.perks.map((perk, index) => (
                              <div key={index} className="text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {perk}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                          Duration: {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MembershipManagement;