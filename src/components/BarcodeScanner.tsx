import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Scan, Clock, User, CheckCircle, XCircle, Loader2, Ticket } from 'lucide-react';
import { TicketSelector } from './TicketSelector';

interface ScanResult {
  barcode: string;
  userName: string;
  action: 'checked_in' | 'checked_out';
  timestamp: string;
}

interface ToggleResult {
  success: boolean;
  error?: string;
  action?: string;
  debug?: any;
  client?: {
    id: string;
    client_code: string;
    full_name: string;
    phone: string;
    email?: string;
    barcode: string;
    active: boolean;
  };
}

interface BarcodeScannerProps {
  scannedByUserId?: string;
}

const BarcodeScanner = ({ scannedByUserId }: BarcodeScannerProps) => {
  const [barcode, setBarcode] = useState('');
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [pendingCheckInClient, setPendingCheckInClient] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcode.trim()) {
      handleScanResult();
    }
  };

  const handleScanResult = async () => {
    if (!barcode.trim()) {
      toast({
        title: "Empty Barcode",
        description: "Please scan or enter a barcode.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    setDebugInfo(null);

    try {
      console.log('📤 Sending barcode to edge function:', barcode.trim());
      
      const { data, error } = await supabase.functions.invoke('checkin-checkout', {
        body: {
          barcode: barcode.trim(),
          scanned_by_user_id: scannedByUserId || null
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Check-in service error: ${error.message}`);
      }

      console.log('📥 Edge function response:', data);

      const result = data as ToggleResult;

      if (result?.success) {
        const action = result.action as 'checked_in' | 'checked_out';
        
        // If checking in, offer ticket option
        if (action === 'checked_in') {
          setPendingCheckInClient({
            id: result.client!.id,
            name: result.client!.full_name
          });
          setShowTicketDialog(true);
          setBarcode('');
        } else {
          const actionText = 'Checked Out';
          
          toast({
            title: `Client ${actionText}`,
            description: `${result.client!.full_name} has been checked out successfully.`,
            variant: "default",
          });

          const scanResult: ScanResult = {
            barcode: barcode.trim(),
            userName: result.client!.full_name,
            action,
            timestamp: new Date().toISOString()
          };

          setLatestScan(scanResult);
          setRecentScans(prev => [scanResult, ...prev].slice(0, 5));
          setBarcode('');
          
          // Emit event to refresh active sessions
          window.dispatchEvent(new CustomEvent('client-status-changed'));
        }
        
        setDebugInfo(result.debug);
      } else {
        console.error('❌ Scan failed:', result?.error);
        setDebugInfo(result?.debug || null);
        
        toast({
          title: "Scan Failed",
          description: result?.error || "Invalid barcode or client not found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Error processing barcode scan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Check-in Error",
        description: errorMessage.includes('Database error') 
          ? "Database connection issue. Please try again in a moment."
          : "Failed to process barcode scan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleTicketAssigned = (ticketData: any) => {
    setShowTicketDialog(false);
    
    if (pendingCheckInClient) {
      toast({
        title: "Check-in Complete",
        description: `${pendingCheckInClient.name} checked in with ${ticketData.ticket_name}`,
      });

      const scanResult: ScanResult = {
        barcode: '',
        userName: pendingCheckInClient.name,
        action: 'checked_in',
        timestamp: new Date().toISOString()
      };

      setLatestScan(scanResult);
      setRecentScans(prev => [scanResult, ...prev].slice(0, 5));
      
      // Emit event to refresh active sessions
      window.dispatchEvent(new CustomEvent('client-status-changed'));
    }
    
    setPendingCheckInClient(null);
  };

  const handleSkipTicket = () => {
    setShowTicketDialog(false);
    
    if (pendingCheckInClient) {
      toast({
        title: "Client Checked In",
        description: `${pendingCheckInClient.name} has been checked in successfully.`,
      });

      const scanResult: ScanResult = {
        barcode: '',
        userName: pendingCheckInClient.name,
        action: 'checked_in',
        timestamp: new Date().toISOString()
      };

      setLatestScan(scanResult);
      setRecentScans(prev => [scanResult, ...prev].slice(0, 5));
      
      // Emit event to refresh active sessions
      window.dispatchEvent(new CustomEvent('client-status-changed'));
    }
    
    setPendingCheckInClient(null);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <>
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Assign Ticket
            </DialogTitle>
            <DialogDescription>
              Choose a ticket type for the client or skip to check in without a ticket
            </DialogDescription>
          </DialogHeader>
          {pendingCheckInClient && (
            <TicketSelector
              clientId={pendingCheckInClient.id}
              clientName={pendingCheckInClient.name}
              onTicketAssigned={handleTicketAssigned}
              onCancel={handleSkipTicket}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Quick Scanner
            </CardTitle>
            <CardDescription>
              Scan client barcode for instant check-in/out
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Scan or type barcode..."
                value={barcode}
                onChange={handleBarcodeInput}
                onKeyPress={handleKeyPress}
                disabled={processing}
                className="flex-1"
              />
              <Button 
                onClick={handleScanResult} 
                disabled={!barcode.trim() || processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Process'
                )}
              </Button>
            </div>

            {barcode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBarcode('');
                  inputRef.current?.focus();
                }}
                className="w-full"
              >
                Clear
              </Button>
            )}

            {debugInfo && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs font-mono">
                  Debug: {JSON.stringify(debugInfo, null, 2)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {latestScan && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Latest Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {latestScan.action === 'checked_in' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-orange-600" />
                  )}
                  <div>
                    <p className="font-semibold">{latestScan.userName}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {latestScan.action.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(latestScan.timestamp)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {recentScans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentScans.map((scan, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{scan.userName}</span>
                      <Badge
                        variant={scan.action === 'checked_in' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {scan.action.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(scan.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default BarcodeScanner;
