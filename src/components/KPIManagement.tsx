import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Plus, Trash2, TrendingUp, Target, DollarSign, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useClientsData } from "@/hooks/useClientsData";

interface KPI {
  id: string;
  name: string;
  current_value: number;
  target_value: number;
  unit: string;
  category: string;
  color: string;
}

const KPIManagement = () => {
  const { toast } = useToast();
  const { financialData } = useFinanceData();
  const { clients, getActiveClientsCount } = useClientsData();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<KPI>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newKPI, setNewKPI] = useState<Partial<KPI>>({
    name: "",
    current_value: 0,
    target_value: 0,
    unit: "",
    category: "Operations",
    color: "text-primary"
  });

  const handleEdit = (kpi: KPI) => {
    setEditingId(kpi.id);
    setEditForm(kpi);
  };

  const handleSave = (id: string) => {
    setKpis(prev => prev.map(kpi => 
      kpi.id === id ? { ...kpi, ...editForm } : kpi
    ));
    setEditingId(null);
    setEditForm({});
    toast({
      title: "KPI Updated",
      description: "KPI has been successfully updated.",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    setKpis(prev => prev.filter(kpi => kpi.id !== id));
    toast({
      title: "KPI Deleted",
      description: "KPI has been removed.",
    });
  };

  const handleAdd = () => {
    if (newKPI.name && newKPI.unit) {
      const id = Date.now().toString();
      setKpis(prev => [...prev, { ...newKPI, id } as KPI]);
      setNewKPI({
        name: "",
        current_value: 0,
        target_value: 0,
        unit: "",
        category: "Operations",
        color: "text-primary"
      });
      setIsAdding(false);
      toast({
        title: "KPI Added",
        description: "New KPI has been added successfully.",
      });
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getKPIIcon = (category: string) => {
    switch (category) {
      case "Finance": return DollarSign;
      case "Growth": return Users;
      case "Operations": return TrendingUp;
      case "Quality": return Target;
      default: return TrendingUp;
    }
  };

  const fetchRealKPIs = async () => {
    try {
      setLoading(true);
      
      // Monthly Revenue
      const currentMonthRevenue = financialData[0]?.revenue || 0;
      const previousMonthRevenue = financialData[1]?.revenue || 0;
      const revenueTarget = previousMonthRevenue > 0 ? previousMonthRevenue * 1.1 : 50000;
      
      // Active Members
      const activeMembers = getActiveClientsCount();
      const totalClients = clients.length;
      const membershipTarget = Math.ceil(totalClients * 0.8);
      
      // Daily Check-ins
      const { data: todayCheckIns } = await supabase
        .from('check_ins')
        .select('id')
        .eq('status', 'checked_in')
        .gte('checked_in_at', new Date().toISOString().split('T')[0]);
      
      const dailyCheckIns = todayCheckIns?.length || 0;
      
      // Customer Satisfaction
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('rating')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      const avgRating = feedbackData && feedbackData.length > 0
        ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length
        : 0;

      setKpis([
        {
          id: "1",
          name: "Monthly Revenue",
          current_value: Math.round(currentMonthRevenue),
          target_value: Math.round(revenueTarget),
          unit: " EGP",
          category: "Finance",
          color: "text-success"
        },
        {
          id: "2", 
          name: "Active Members",
          current_value: activeMembers,
          target_value: membershipTarget,
          unit: " members",
          category: "Growth",
          color: "text-primary"
        },
        {
          id: "3",
          name: "Daily Check-ins",
          current_value: dailyCheckIns,
          target_value: 100,
          unit: " check-ins",
          category: "Operations",
          color: "text-accent"
        },
        {
          id: "4",
          name: "Customer Satisfaction",
          current_value: Number(avgRating.toFixed(1)),
          target_value: 4.8,
          unit: "/5",
          category: "Quality",
          color: "text-warning"
        }
      ]);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch KPI data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (financialData.length > 0 && clients.length > 0) {
      fetchRealKPIs();
    }
  }, [financialData, clients]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>KPI Management</CardTitle>
              <CardDescription>Monitor and edit key performance indicators</CardDescription>
            </div>
            <Button onClick={() => setIsAdding(true)} variant="professional">
              <Plus className="h-4 w-4" />
              Add KPI
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add New KPI Form */}
          {isAdding && (
            <Card className="mb-6 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Add New KPI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-name">KPI Name</Label>
                    <Input
                      id="new-name"
                      value={newKPI.name || ""}
                      onChange={(e) => setNewKPI(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Monthly Revenue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-unit">Unit</Label>
                    <Input
                      id="new-unit"
                      value={newKPI.unit || ""}
                      onChange={(e) => setNewKPI(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="e.g., EGP, %, members"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-current">Current Value</Label>
                    <Input
                      id="new-current"
                      type="number"
                      value={newKPI.current_value || ""}
                      onChange={(e) => setNewKPI(prev => ({ ...prev, current_value: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-target">Target Value</Label>
                    <Input
                      id="new-target"
                      type="number"
                      value={newKPI.target_value || ""}
                      onChange={(e) => setNewKPI(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-category">Category</Label>
                    <select
                      id="new-category"
                      className="w-full px-3 py-2 border border-input rounded-md"
                      value={newKPI.category || "Operations"}
                      onChange={(e) => setNewKPI(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Finance">Finance</option>
                      <option value="Growth">Growth</option>
                      <option value="Operations">Operations</option>
                      <option value="Quality">Quality</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="new-color">Color</Label>
                    <select
                      id="new-color"
                      className="w-full px-3 py-2 border border-input rounded-md"
                      value={newKPI.color || "text-primary"}
                      onChange={(e) => setNewKPI(prev => ({ ...prev, color: e.target.value }))}
                    >
                      <option value="text-primary">Primary</option>
                      <option value="text-success">Success</option>
                      <option value="text-warning">Warning</option>
                      <option value="text-accent">Accent</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAdd} variant="professional">
                    <Save className="h-4 w-4" />
                    Save KPI
                  </Button>
                  <Button onClick={() => setIsAdding(false)} variant="outline">
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {kpis.map((kpi) => {
              const Icon = getKPIIcon(kpi.category);
              const isEditing = editingId === kpi.id;
              const progress = getProgressPercentage(kpi.current_value, kpi.target_value);
              
              return (
                <Card key={kpi.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${kpi.color}`} />
                        {isEditing ? (
                          <Input
                            value={editForm.name || ""}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="h-6 text-sm font-semibold"
                          />
                        ) : (
                          <CardTitle className="text-sm">{kpi.name}</CardTitle>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {isEditing ? (
                          <>
                            <Button onClick={() => handleSave(kpi.id)} size="sm" variant="ghost">
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button onClick={handleCancel} size="sm" variant="ghost">
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={() => handleEdit(kpi)} size="sm" variant="ghost">
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button onClick={() => handleDelete(kpi.id)} size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="w-fit text-xs">
                      {kpi.category}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editForm.current_value || ""}
                              onChange={(e) => setEditForm(prev => ({ ...prev, current_value: parseFloat(e.target.value) || 0 }))}
                              className="w-20 h-8"
                            />
                            <Input
                              value={editForm.unit || ""}
                              onChange={(e) => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
                              className="w-16 h-8"
                            />
                          </div>
                        ) : (
                          <span className="text-2xl font-bold">
                            {kpi.current_value.toLocaleString()}{kpi.unit}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Target: {isEditing ? (
                            <Input
                              type="number"
                              value={editForm.target_value || ""}
                              onChange={(e) => setEditForm(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))}
                              className="inline-block w-20 h-6"
                            />
                          ) : (
                            `${kpi.target_value.toLocaleString()}${kpi.unit}`
                          )}</span>
                          <span className={progress >= 100 ? "text-success" : progress >= 80 ? "text-warning" : "text-muted-foreground"}>
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              progress >= 100 ? "bg-success" : 
                              progress >= 80 ? "bg-warning" : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KPIManagement;