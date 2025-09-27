import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  client_code: string;
  full_name: string;
  phone: string;
  email?: string;
  active: boolean;
  barcode?: string;
}

interface ClientSelectorProps {
  onClientSelect: (client: Client | null) => void;
  selectedClientId?: string;
}

const ClientSelector = ({ onClientSelect, selectedClientId }: ClientSelectorProps) => {
  const [activeClients, setActiveClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveClients();
  }, []);

  useEffect(() => {
    // Filter clients based on search term
    const filtered = activeClients.filter(client => 
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      (client.barcode && client.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredClients(filtered);
  }, [searchTerm, activeClients]);

  const fetchActiveClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, client_code, full_name, phone, email, active, barcode')
        .eq('is_active', true)
        .eq('active', true)
        .order('full_name');

      if (error) throw error;

      setActiveClients(data || []);
    } catch (error) {
      console.error('Error fetching active clients:', error);
      toast({
        title: "Error Loading Clients",
        description: "Failed to load active clients. Please try again.",
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
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Select Active Client
      </Label>
      
      {/* Barcode/Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, code, or barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
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
          {filteredClients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="font-medium">{client.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {client.client_code} • {client.barcode}
                  </div>
                </div>
                <Badge variant="default" className="ml-2 bg-green-100 text-green-800">Active</Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {filteredClients.length === 0 && searchTerm && (
        <p className="text-sm text-muted-foreground">
          No clients found matching "{searchTerm}". Try searching by name, client code, or barcode.
        </p>
      )}
      
      {activeClients.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">
          No active clients found. Clients need to be checked in first.
        </p>
      )}
      
      {filteredClients.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} available
        </p>
      )}
    </div>
  );
};

export default ClientSelector;