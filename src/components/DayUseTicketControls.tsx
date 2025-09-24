import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Ticket, Edit, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DayUseTicketControls = () => {
  const [ticketSettings, setTicketSettings] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchTicketSettings();
  }, []);

  const fetchTicketSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('day_use_ticket_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setTicketSettings(data);
      if (data) {
        setEditForm({
          name: data.name,
          price: data.price.toString(),
          description: data.description || '',
          is_active: data.is_active
        });
      }
    } catch (error) {
      console.error('Error fetching ticket settings:', error);
      toast.error('Failed to load ticket settings');
    }
  };

  const handleSave = async () => {
    try {
      const price = parseFloat(editForm.price);
      if (isNaN(price) || price < 0) {
        toast.error('Please enter a valid price');
        return;
      }

      const ticketData = {
        name: editForm.name.trim(),
        price: price,
        description: editForm.description.trim(),
        is_active: editForm.is_active
      };

      if (ticketSettings?.id) {
        // Update existing setting
        const { error } = await supabase
          .from('day_use_ticket_settings')
          .update(ticketData)
          .eq('id', ticketSettings.id);

        if (error) throw error;
      } else {
        // Create new setting
        const { error } = await supabase
          .from('day_use_ticket_settings')
          .insert(ticketData);

        if (error) throw error;
      }

      setIsEditing(false);
      await fetchTicketSettings();
      toast.success('Day use ticket settings updated successfully');
    } catch (error) {
      console.error('Error saving ticket settings:', error);
      toast.error('Failed to save ticket settings');
    }
  };

  const handleCancel = () => {
    if (ticketSettings) {
      setEditForm({
        name: ticketSettings.name,
        price: ticketSettings.price.toString(),
        description: ticketSettings.description || '',
        is_active: ticketSettings.is_active
      });
    }
    setIsEditing(false);
  };

  if (!ticketSettings && !isEditing) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">No day use ticket settings configured</p>
        <Button onClick={() => setIsEditing(true)} variant="professional">
          <Ticket className="h-4 w-4 mr-2" />
          Setup Day Use Ticket
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isEditing ? (
        // Display Mode
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{ticketSettings?.name}</h4>
              <Badge variant={ticketSettings?.is_active ? "default" : "secondary"}>
                {ticketSettings?.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">${ticketSettings?.price?.toFixed(2)}</span>
              </div>
              {ticketSettings?.description && (
                <div>
                  <span className="text-xs text-muted-foreground">Description:</span>
                  <p className="text-sm">{ticketSettings.description}</p>
                </div>
              )}
            </div>

            <Button 
              onClick={() => setIsEditing(true)} 
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Edit Mode
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-name">Ticket Name</Label>
            <Input
              id="ticket-name"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Standard Day Use Ticket"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-price">Price ($)</Label>
            <Input
              id="ticket-price"
              type="number"
              step="0.01"
              min="0"
              value={editForm.price}
              onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">Description</Label>
            <Input
              id="ticket-description"
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the ticket"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={editForm.is_active}
              onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
            />
            <Label>Active</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} variant="professional" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleCancel} variant="outline" className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayUseTicketControls;