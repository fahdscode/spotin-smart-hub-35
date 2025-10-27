import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Ticket, Settings, DollarSign, Plus, Loader2, Coffee } from "lucide-react";
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
  ticket_type: string;
  max_free_drink_price: number;
}

interface TicketItem {
  id: string;
  name: string;
  price: number;
  description: string;
  is_active: boolean;
  includes_free_drink: boolean;
  ticket_type: string;
  max_free_drink_price: number;
}

const DayUseTicketControls = () => {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [settings, setSettings] = useState<TicketSettings>({
    name: "Day Use Pass",
    price: 25.00,
    description: "Full day access to workspace, WiFi, and common areas",
    is_active: true,
    includes_free_drink: false,
    ticket_type: "day_use",
    max_free_drink_price: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTicketSettings();
  }, []);

  const fetchTicketSettings = async () => {
    try {
      setLoading(true);
      // Fetch all tickets in the day_use_ticket category
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .eq('category', 'day_use_ticket')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setTickets(data.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description || "",
          is_active: item.is_available,
          includes_free_drink: item.ingredients?.includes('free_drink') || false,
          ticket_type: item.ticket_type || 'day_use',
          max_free_drink_price: item.max_free_drink_price || 0
        })));
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching ticket settings:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        // Update existing ticket
        const { error } = await supabase
          .from('drinks')
          .update({
            name: settings.name,
            price: settings.price,
            description: settings.description,
            is_available: settings.is_active,
            ingredients: settings.includes_free_drink ? ['free_drink'] : [],
            ticket_type: settings.ticket_type,
            max_free_drink_price: settings.max_free_drink_price
          })
          .eq('id', settings.id);

        if (error) throw error;

        toast({
          title: "Ticket Updated",
          description: "Ticket settings have been updated successfully.",
        });
      } else {
        // Create new ticket
        const { error } = await supabase
          .from('drinks')
          .insert({
            name: settings.name,
            price: settings.price,
            description: settings.description,
            category: 'day_use_ticket',
            is_available: settings.is_active,
            ingredients: settings.includes_free_drink ? ['free_drink'] : [],
            ticket_type: settings.ticket_type,
            max_free_drink_price: settings.max_free_drink_price
          });

        if (error) throw error;

        toast({
          title: "Ticket Created",
          description: "New ticket has been created successfully.",
        });
      }

      await fetchTicketSettings();
      setIsEditing(false);
      setIsAdding(false);
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
    setIsEditing(false);
    setIsAdding(false);
    setSettings({
      name: "Day Use Pass",
      price: 25.00,
      description: "Full day access to workspace, WiFi, and common areas",
      is_active: true,
      includes_free_drink: false,
      ticket_type: "day_use",
      max_free_drink_price: 0
    });
  };

  const handleActiveToggle = async (ticketId: string, checked: boolean) => {
    setToggling(true);
    try {
      const { error } = await supabase
        .from('drinks')
        .update({ is_available: checked })
        .eq('id', ticketId);

      if (error) throw error;

      await fetchTicketSettings();

      toast({
        title: checked ? "Ticket Sales Activated" : "Ticket Sales Deactivated",
        description: `Ticket sales have been ${checked ? 'enabled' : 'disabled'}.`,
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

  const handleEdit = (ticket: TicketItem) => {
    setSettings({
      id: ticket.id,
      name: ticket.name,
      price: ticket.price,
      description: ticket.description,
      is_active: ticket.is_active,
      includes_free_drink: ticket.includes_free_drink,
      ticket_type: ticket.ticket_type,
      max_free_drink_price: ticket.max_free_drink_price
    });
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setSettings({
      name: "",
      price: 0,
      description: "",
      is_active: true,
      includes_free_drink: false,
      ticket_type: "day_use",
      max_free_drink_price: 0
    });
    setIsAdding(true);
    setIsEditing(true);
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

  if (tickets.length === 0 && !isEditing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <CardTitle>Tickets Management</CardTitle>
          </div>
          <CardDescription>
            Create different types of tickets for walk-in customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Tickets Configured</h3>
            <p className="text-muted-foreground mb-4">
              Create tickets like Day Use Pass, Event Tickets, Premium Access, etc.
            </p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Ticket
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
            <CardTitle>Tickets Management</CardTitle>
          </div>
          {!isEditing && (
            <Button onClick={handleAddNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add New Ticket
            </Button>
          )}
        </div>
        <CardDescription>
          Manage ticket types and pricing for walk-in customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEditing ? (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{ticket.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {ticket.ticket_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{ticket.description}</p>
                  {ticket.includes_free_drink && (
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                        Includes Free Drink
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Max: {ticket.max_free_drink_price.toFixed(2)} EGP
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary flex items-center gap-1">
                      <DollarSign className="h-5 w-5" />
                      {ticket.price.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">EGP</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Switch 
                      checked={ticket.is_active} 
                      onCheckedChange={(checked) => handleActiveToggle(ticket.id, checked)}
                      disabled={toggling}
                    />
                    <Button 
                      onClick={() => handleEdit(ticket)}
                      variant="outline" 
                      size="sm"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ticket Name</label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Day Use Pass, Event Ticket, Premium Access"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ticket Type</label>
              <select 
                className="w-full p-2 border rounded-md bg-background"
                value={settings.ticket_type}
                onChange={(e) => setSettings(prev => ({ ...prev, ticket_type: e.target.value }))}
              >
                <option value="day_use">Day Use</option>
                <option value="event">Event Ticket</option>
                <option value="drink_included">With Drink</option>
                <option value="premium">Premium Access</option>
                <option value="hourly">Hourly Pass</option>
                <option value="weekly">Weekly Pass</option>
                <option value="monthly">Monthly Pass</option>
              </select>
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
                placeholder="Describe what's included"
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

            {settings.includes_free_drink && (
              <div className="space-y-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-green-600" />
                  Maximum Free Drink Price (EGP)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.max_free_drink_price}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    max_free_drink_price: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="e.g., 15.00"
                />
                <p className="text-xs text-muted-foreground">
                  Clients can choose any drink up to this price for free
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isAdding ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  isAdding ? 'Create Ticket' : 'Save Changes'
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