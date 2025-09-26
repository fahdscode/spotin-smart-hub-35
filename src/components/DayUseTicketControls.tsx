import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Ticket, Settings, DollarSign } from "lucide-react";

// Mock data for day use tickets - replace with actual Supabase integration later
const mockTicketSettings = {
  name: "Day Use Pass",
  price: 25.00,
  description: "Full day access to workspace, WiFi, and common areas",
  is_active: true
};

const DayUseTicketControls = () => {
  const [settings, setSettings] = useState(mockTicketSettings);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // TODO: Implement save to Supabase when table is created
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSettings(mockTicketSettings);
    setIsEditing(false);
  };

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
              <div>
                <h3 className="font-semibold">{settings.name}</h3>
                <p className="text-sm text-muted-foreground">{settings.description}</p>
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
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
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

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1">
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