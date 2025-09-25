import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

// Mock data for active clients
const mockActiveClients: Client[] = [
  {
    id: "1",
    client_code: "C-2024-000001",
    full_name: "Ahmed Hassan",
    phone: "+20123456789",
    email: "ahmed.hassan@email.com",
    active: true,
    barcode: "AH2024"
  },
  {
    id: "2", 
    client_code: "C-2024-000002",
    full_name: "Fatima Ali",
    phone: "+20987654321",
    email: "fatima.ali@email.com", 
    active: true,
    barcode: "FA2024"
  },
  {
    id: "3",
    client_code: "C-2024-000003", 
    full_name: "Mohamed Salem",
    phone: "+20555123456",
    email: "mohamed.salem@email.com",
    active: true,
    barcode: "MS2024"
  },
  {
    id: "4",
    client_code: "C-2024-000004",
    full_name: "Nour Ibrahim", 
    phone: "+20444567890",
    email: "nour.ibrahim@email.com",
    active: true,
    barcode: "NI2024"
  },
  {
    id: "5",
    client_code: "C-2024-000005",
    full_name: "Omar Khaled",
    phone: "+20333789123", 
    email: "omar.khaled@email.com",
    active: true,
    barcode: "OK2024"
  }
];

const ClientSelector = ({ onClientSelect, selectedClientId }: ClientSelectorProps) => {
  const [activeClients, setActiveClients] = useState<Client[]>(mockActiveClients);
  const [filteredClients, setFilteredClients] = useState<Client[]>(mockActiveClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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