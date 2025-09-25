import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  client_code: string;
  full_name: string;
  phone: string;
  email?: string;
  active: boolean;
}

interface ClientSelectorProps {
  onClientSelect: (client: Client | null) => void;
  selectedClientId?: string;
}

const ClientSelector = ({ onClientSelect, selectedClientId }: ClientSelectorProps) => {
  const [activeClients, setActiveClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveClients();
  }, []);

  const fetchActiveClients = async () => {
    try {
      const { data, error } = await supabase.rpc('get_receptionist_active_sessions');
      
      if (error) throw error;
      
      const clients = Array.isArray(data) ? data.map((item: any) => ({
        id: item.id,
        client_code: item.client_code,
        full_name: item.full_name,
        phone: item.phone,
        email: item.email,
        active: item.active
      })) : [];
      setActiveClients(clients);
    } catch (error: any) {
      toast({
        title: "Error fetching active clients",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    if (clientId === "none") {
      onClientSelect(null);
      return;
    }
    
    const selectedClient = activeClients.find(client => client.id === clientId);
    if (selectedClient) {
      onClientSelect(selectedClient);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Select Active Client
      </Label>
      <Select 
        value={selectedClientId || "none"} 
        onValueChange={handleClientChange}
        disabled={loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading clients..." : "Choose a client"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No specific client</SelectItem>
          {activeClients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="font-medium">{client.full_name}</div>
                  <div className="text-xs text-muted-foreground">{client.client_code}</div>
                </div>
                <Badge variant="default" className="ml-2 bg-green-100 text-green-800">Active</Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {activeClients.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">
          No active clients found. Clients need to be checked in first.
        </p>
      )}
      
      {activeClients.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {activeClients.length} active client{activeClients.length !== 1 ? 's' : ''} available
        </p>
      )}
    </div>
  );
};

export default ClientSelector;