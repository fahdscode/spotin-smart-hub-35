import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Crown, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MembershipPlan {
  id: string;
  plan_name: string;
  description: string;
  discount_percentage: number;
  perks: string[];
  is_active: boolean;
  duration_months: number;
  price: number;
  created_at: string;
}

const MembershipPlansManagement = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    plan_name: "",
    description: "",
    discount_percentage: 0,
    perks: "",
    is_active: true,
    duration_months: 1,
    price: 0
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load membership plans",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const perksArray = formData.perks.split(',').map(p => p.trim()).filter(p => p);
      
      const planData = {
        plan_name: formData.plan_name,
        description: formData.description,
        discount_percentage: formData.discount_percentage,
        perks: perksArray,
        is_active: formData.is_active,
        duration_months: formData.duration_months,
        price: formData.price
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('membership_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Membership plan updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('membership_plans')
          .insert([planData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Membership plan created successfully",
        });
      }

      await fetchPlans();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save membership plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      description: plan.description || "",
      discount_percentage: plan.discount_percentage,
      perks: plan.perks.join(', '),
      is_active: plan.is_active,
      duration_months: plan.duration_months,
      price: plan.price
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this membership plan?")) return;

    try {
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      await fetchPlans();
      
      toast({
        title: "Success",
        description: "Membership plan deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete membership plan",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      plan_name: "",
      description: "",
      discount_percentage: 0,
      perks: "",
      is_active: true,
      duration_months: 1,
      price: 0
    });
    setEditingPlan(null);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'premium':
        return <Zap className="h-5 w-5 text-blue-500" />;
      case 'enterprise':
        return <Crown className="h-5 w-5 text-purple-500" />;
      default:
        return <Star className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return 'bg-yellow-50 border-yellow-200';
      case 'premium':
        return 'bg-blue-50 border-blue-200';
      case 'enterprise':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getDurationLabel = (durationMonths: number) => {
    if (durationMonths === 1) return 'Monthly';
    if (durationMonths === 3) return '3 Months';
    if (durationMonths === 6) return '6 Months';
    if (durationMonths === 12) return 'Annual';
    return `${durationMonths} Months`;
  };

  const filteredPlans = plans.filter(plan =>
    plan.plan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Membership Plans Management</CardTitle>
              <CardDescription>Create and manage membership plans with benefits and pricing</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} variant="professional">
                  <Plus className="h-4 w-4" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPlan ? 'Edit Membership Plan' : 'Add New Membership Plan'}</DialogTitle>
                  <DialogDescription>
                    {editingPlan ? 'Update membership plan details' : 'Create a new membership plan'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="plan_name">Plan Name</Label>
                    <Input
                      id="plan_name"
                      value={formData.plan_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                      placeholder="e.g., Premium"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Plan description and benefits overview"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discount_percentage">Discount (%)</Label>
                      <Input
                        id="discount_percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: parseInt(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration_months">Duration (Months)</Label>
                      <Select
                        value={formData.duration_months.toString()}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, duration_months: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-input z-50">
                          <SelectItem value="1">1 Month</SelectItem>
                          <SelectItem value="3">3 Months</SelectItem>
                          <SelectItem value="6">6 Months</SelectItem>
                          <SelectItem value="12">12 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="price">Price (EGP)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="Enter plan price"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="perks">Perks (comma-separated)</Label>
                    <Textarea
                      id="perks"
                      value={formData.perks}
                      onChange={(e) => setFormData(prev => ({ ...prev, perks: e.target.value }))}
                      placeholder="e.g., Free coffee, Priority booking, Meeting room access"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active plan</Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search membership plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />

            <div className="grid gap-4">
              {filteredPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No plans match your search.' : 'No membership plans found.'}
                </div>
              ) : (
                filteredPlans.map((plan) => (
                  <Card key={plan.id} className={`p-4 ${getPlanColor(plan.plan_name)}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getPlanIcon(plan.plan_name)}
                          <h3 className="font-semibold text-lg">{plan.plan_name}</h3>
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {plan.discount_percentage}% off
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{plan.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="font-medium">{plan.price} EGP</span>
                          <span>{plan.discount_percentage}% discount on services</span>
                          <Badge variant="secondary" className="text-xs">
                            {getDurationLabel(plan.duration_months)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Perks:</p>
                          <div className="flex flex-wrap gap-1">
                            {plan.perks.map((perk, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {perk}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipPlansManagement;