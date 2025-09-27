import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CheckInTestHelper = () => {
  const [processingBarcode, setProcessingBarcode] = useState<string | null>(null);
  const { toast } = useToast();
  const testBarcodes = [
    { barcode: 'JK48F2', name: 'Norhan khalifa', status: 'checked_out' },
    { barcode: 'JANFPR', name: 'Bakr TresG', status: 'checked_out' },
    { barcode: '5EZ56N', name: 'zilteport zilte', status: 'checked_out' },
    { barcode: 'AH2025X', name: 'Ahmed Hassan', status: 'checked_in' },
    { barcode: 'AH2025', name: 'Ahmed Hassan', status: 'checked_in' },
    { barcode: 'ABC123', name: 'John Smith', status: 'checked_in' },
    { barcode: 'GHI789', name: 'Mike Wilson', status: 'checked_in' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `Barcode "${text}" copied to clipboard.`,
    });
  };

  const handleQuickCheckIn = async (barcode: string) => {
    setProcessingBarcode(barcode);
    
    try {
      console.log('🚀 Quick check-in for barcode:', barcode);
      
      const { data, error } = await supabase.rpc('toggle_client_checkin_status', {
        p_barcode: barcode,
        p_scanned_by_user_id: null // Test without user ID
      });

      console.log('📡 Quick check-in response:', { data, error });

      if (error) {
        console.error('❌ RPC Error:', error);
        throw error;
      }

      const result = data as any;
      if (result?.success) {
        const action = result.action.replace('_', ' ');
        console.log('✅ Quick check-in successful:', result);
        
        toast({
          title: `Quick ${action} Successful!`,
          description: `${result.client.full_name} has been ${action}.`,
        });
      } else {
        console.log('❌ Quick check-in failed:', result);
        toast({
          title: "Check-in Failed",
          description: result?.error || "Unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Quick check-in system error:', error);
      toast({
        title: "System Error",
        description: `Failed to process quick check-in: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setProcessingBarcode(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Check-In System Test Helper
        </CardTitle>
        <CardDescription>
          Test barcodes from the database. Click to copy and paste into the scanner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {testBarcodes.map((client) => (
            <div key={client.barcode} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {client.status === 'checked_in' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Barcode: <code className="bg-muted px-1 rounded">{client.barcode}</code>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={client.status === 'checked_in' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {client.status === 'checked_in' ? 'CHECKED IN' : 'CHECKED OUT'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(client.barcode)}
                >
                  Copy
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickCheckIn(client.barcode)}
                  disabled={processingBarcode === client.barcode}
                  className="flex items-center gap-1"
                >
                  <Zap className="h-3 w-3" />
                  {processingBarcode === client.barcode ? 'Processing...' : 'Quick Check'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Test Instructions:</strong>
            <br />• <strong>Quick Check:</strong> Click the "Quick Check" button to instantly toggle check-in status
            <br />• <strong>Manual Test:</strong> Click "Copy" → Open the Check-In Scanner → Paste barcode → Press Enter
            <br />• <strong>Real-time Updates:</strong> Check the Client Dashboard to see status changes reflected immediately
            <br />• Both methods should work and update the client's status in real-time
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckInTestHelper;