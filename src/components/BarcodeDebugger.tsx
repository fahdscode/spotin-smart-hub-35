import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, RefreshCw, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  client_code: string;
  barcode: string;
  full_name: string;
  active: boolean;
  is_active: boolean;
}

export default function BarcodeDebugger() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, client_code, barcode, full_name, active, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch client data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const testBarcode = async (barcode: string, clientName: string) => {
    try {
      toast({
        title: "Testing Barcode",
        description: `Testing barcode for ${clientName}...`,
      });

      const { data, error } = await supabase.rpc('toggle_client_checkin_status', {
        p_barcode: barcode,
        p_scanned_by_user_id: null
      });

      if (error) throw error;

      console.log('Test result:', data);
      
      const result = data as { success: boolean; action?: string; error?: string };
      
      if (result?.success) {
        toast({
          title: "✅ Test Successful",
          description: `${clientName} - ${result.action}`,
        });
        fetchClients(); // Refresh the list
      } else {
        toast({
          title: "❌ Test Failed",
          description: result?.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "❌ System Error",
        description: "Failed to test barcode",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `Barcode copied to clipboard: ${text}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Barcode Debugger
        </CardTitle>
        <CardDescription>
          All active client barcodes for testing. Click to copy or test.
        </CardDescription>
        <Button 
          onClick={fetchClients} 
          disabled={loading}
          size="sm"
          variant="outline"
          className="w-fit"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {clients.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No active clients found
            </p>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{client.full_name}</span>
                    <Badge variant={client.active ? "default" : "secondary"}>
                      {client.active ? "CHECKED IN" : "CHECKED OUT"}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {client.client_code}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-muted/50 p-2 rounded font-mono text-sm break-all">
                    {client.barcode}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(client.barcode)}
                      className="flex-1"
                    >
                      Copy Barcode
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => testBarcode(client.barcode, client.full_name)}
                      className="flex-1"
                    >
                      Test Check-in/out
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}