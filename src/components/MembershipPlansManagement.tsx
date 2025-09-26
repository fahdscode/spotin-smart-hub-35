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

interface MembershipPlan {
  id: string;
  plan_name: string;
  description: string;
  discount_percentage: number;
  perks: string[];
  is_active: boolean;
  duration_type: 'weekly' | 'monthly' | '6months' | 'annual';
  price: number;
  created_at: string;
}

const MembershipPlansManagement = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([
    {
      id: "1",
      plan_name: "Basic Weekly",
      description: "Essential workspace access for a week",
      discount_percentage: 5,
      perks: ["5% discount on drinks", "Basic Wi-Fi", "Access to common areas"],
      is_active: true,
      duration_type: 'weekly',
      price: 25,
      created_at: new Date().toISOString()
    },
    {
      id: "2", 
      plan_name: "Premium Monthly",
      description: "Enhanced workspace experience for a month",
      discount_percentage: 15,
      perks: ["15% discount on all services", "Priority booking", "Free coffee daily", "Meeting room credits"],
      is_active: true,
      duration_type: 'monthly',
      price: 199,
      created_at: new Date().toISOString()
    },
    {
      id: "3",
      plan_name: "Enterprise Semi-Annual",
      description: "Complete 6-month workspace solution for teams",
      discount_percentage: 25,
      perks: ["25% discount on all services", "Dedicated desk space", "Unlimited meeting rooms", "24/7 access", "Personal assistant"],
      is_active: true,
      duration_type: '6months',
      price: 999,
      created_at: new Date().toISOString()
    },
    {
      id: "4",
      plan_name: "Annual VIP",
      description: "Ultimate annual membership with maximum benefits",
      discount_percentage: 35,
      perks: ["35% discount on all services", "Private office access", "Unlimited everything", "Concierge service", "Event hosting privileges"],
      is_active: true,
      duration_type: 'annual',
      price: 1899,
      created_at: new Date().toISOString()
    }
  ]);
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
    duration_type: 'monthly' as 'weekly' | 'monthly' | '6months' | 'annual',
    price: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const perksArray = formData.perks.split(',').map(p => p.trim()).filter(p => p);
      
      const planData: MembershipPlan = {
        id: editingPlan?.id || Date.now().toString(),
        plan_name: formData.plan_name,
        description: formData.description,
        discount_percentage: formData.discount_percentage,
        perks: perksArray,
        is_active: formData.is_active,
        duration_type: formData.duration_type,
        price: formData.price,
        created_at: editingPlan?.created_at || new Date().toISOString()
      };

      if (editingPlan) {
        setPlans(prev => prev.map(plan => 
          plan.id === editingPlan.id ? planData : plan
        ));
        
        toast({
          title: "Success",
          description: "Membership plan updated successfully",
        });
      } else {
        setPlans(prev => [planData, ...prev]);
        
        toast({
          title: "Success",
          description: "Membership plan created successfully",
        });
      }

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
      description: plan.description,
      discount_percentage: plan.discount_percentage,
      perks: plan.perks.join(', '),
      is_active: plan.is_active,
      duration_type: plan.duration_type,
      price: plan.price
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this membership plan?")) return;

    try {
      setPlans(prev => prev.filter(plan => plan.id !== planId));
      
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
      duration_type: 'monthly',
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

  const getDurationLabel = (durationType: string) => {
    switch (durationType) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case '6months': return '6 Months';
      case 'annual': return 'Annual';
      default: return 'Monthly';
    }
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
                      <Label htmlFor="duration_type">Duration</Label>
                      <Select
                        value={formData.duration_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, duration_type: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-input z-50">
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="6months">6 Months</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder={`Price for ${getDurationLabel(formData.duration_type).toLowerCase()} plan`}
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
                          <span className="font-medium">{plan.price} EGP/{getDurationLabel(plan.duration_type).toLowerCase()}</span>
                          <span>{plan.discount_percentage}% discount on services</span>
                          <Badge variant="secondary" className="text-xs">
                            {getDurationLabel(plan.duration_type)}
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