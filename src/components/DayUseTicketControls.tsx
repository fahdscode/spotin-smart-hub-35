import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Ticket, Settings, DollarSign, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TicketExpiryCountdown } from "./TicketExpiryCountdown";

interface TicketSettings {
  id?: string;
  name: string;
  price: number;
  description: string;
  is_active: boolean;
  includes_free_drink: boolean;
}

const DayUseTicketControls = () => {
  const [settings, setSettings] = useState<TicketSettings>({
    name: "Day Use Pass",
    price: 25.00,
    description: "Full day access to workspace, WiFi, and common areas",
    is_active: true,
    includes_free_drink: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [hasSettings, setHasSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTicketSettings();
  }, []);

  const fetchTicketSettings = async () => {
    try {
      setLoading(true);
      // Check for day use ticket in drinks table
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .eq('category', 'day_use_ticket')
        .maybeSingle();

      if (data) {
        setSettings({
          id: data.id,
          name: data.name,
          price: data.price,
          description: data.description || "Full day access to workspace, WiFi, and common areas",
          is_active: data.is_available,
          includes_free_drink: data.ingredients?.includes('free_drink') || false
        });
        setHasSettings(true);
      } else {
        setHasSettings(false);
      }
    } catch (error) {
      console.error('Error fetching ticket settings:', error);
      setHasSettings(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (hasSettings && settings.id) {
        const { error } = await supabase
          .from('drinks')
          .update({
            name: settings.name,
            price: settings.price,
            description: settings.description,
            is_available: settings.is_active,
            ingredients: settings.includes_free_drink ? ['free_drink'] : []
          })
          .eq('id', settings.id);

        if (error) throw error;

        toast({
          title: "Settings Updated",
          description: "Day use ticket settings have been updated successfully.",
        });
      } else {
        const { data, error } = await supabase
          .from('drinks')
          .insert({
            name: settings.name,
            price: settings.price,
            description: settings.description,
            category: 'day_use_ticket',
            is_available: settings.is_active,
            ingredients: settings.includes_free_drink ? ['free_drink'] : []
          })
          .select()
          .single();

        if (error) throw error;

        setSettings(prev => ({ ...prev, id: data.id }));
        setHasSettings(true);

        toast({
          title: "Day Use Ticket Created",
          description: "Day use ticket has been set up successfully.",
        });
      }

      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save ticket settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchTicketSettings();
    setIsEditing(false);
  };

  const handleActiveToggle = async (checked: boolean) => {
    if (!hasSettings || !settings.id) return;

    setToggling(true);
    try {
      const { error } = await supabase
        .from('drinks')
        .update({ is_available: checked })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, is_active: checked }));

      toast({
        title: checked ? "Ticket Sales Activated" : "Ticket Sales Deactivated",
        description: `Day use ticket sales have been ${checked ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center h-32 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading ticket settings...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasSettings && !isEditing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <CardTitle>Day Use Tickets</CardTitle>
          </div>
          <CardDescription>
            Set up day use ticket pricing and availability for walk-in customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Day Use Ticket Configured</h3>
            <p className="text-muted-foreground mb-4">
              Create a day use ticket option for walk-in customers to access your workspace.
            </p>
            <Button onClick={() => setIsEditing(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Set Up Day Use Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <CardTitle>Day Use Tickets</CardTitle>
          </div>
          <Badge variant={settings.is_active ? "default" : "secondary"}>
            {settings.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <CardDescription>
          Manage day use ticket pricing and availability for walk-in customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold">{settings.name}</h3>
                <p className="text-sm text-muted-foreground">{settings.description}</p>
                {settings.includes_free_drink && (
                  <Badge variant="secondary" className="mt-2">
                    Includes Free Drink
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary flex items-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {settings.price.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">per day</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ticket Sales Active</span>
              <Switch 
                checked={settings.is_active} 
                onCheckedChange={handleActiveToggle}
                disabled={!hasSettings || toggling}
              />
            </div>

            {/* Countdown Timer Example */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-3">Example: How countdown appears for clients</p>
              <TicketExpiryCountdown 
                purchaseTime={new Date(Date.now() - 20 * 60 * 60 * 1000)} // 20 hours ago
                expiryHours={24}
                onExpired={() => {
                  toast({
                    title: "Example Ticket Expired",
                    description: "This is just a demo countdown.",
                    variant: "destructive"
                  });
                }}
              />
            </div>

            <Button 
              onClick={() => setIsEditing(true)}
              variant="outline" 
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ticket Name</label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter ticket name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Price (EGP)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={settings.price}
                onChange={(e) => setSettings(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter price"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={settings.description}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active</span>
              <Switch 
                checked={settings.is_active} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Include Free Drink</span>
                <p className="text-xs text-muted-foreground">Customers get one complimentary drink</p>
              </div>
              <Switch 
                checked={settings.includes_free_drink} 
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includes_free_drink: checked }))}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {hasSettings ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  hasSettings ? 'Save Changes' : 'Create Ticket'
                )}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1" disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DayUseTicketControls;