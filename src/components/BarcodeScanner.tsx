import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QrCode, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ScanResult {
  barcode: string;
  userName: string;
  action: 'check-in' | 'check-out';
  timestamp: Date;
  clientId?: string;
  clientCode?: string;
}

export default function BarcodeScanner() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Focus the input field when component mounts
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const handleBarcodeInput = (value: string) => {
    setBarcodeInput(value);
    
    // Auto-process when barcode is complete (assuming client codes follow C-YYYY-XXXXXX pattern)
    if (value.length >= 10 && value.startsWith('C-')) {
      handleScanResult(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      handleScanResult(barcodeInput.trim());
    }
  };

  const handleScanResult = async (barcode: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setScanResult(null);

    try {
      // Find the client by barcode or client_code
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, client_code, full_name, phone, email, barcode, is_active')
        .or(`barcode.eq.${barcode},client_code.eq.${barcode}`)
        .eq('is_active', true)
        .single();

      if (clientError || !clientData) {
        toast({
          title: "Client not found",
          description: `No active client found with barcode: ${barcode}. Please check and try again.`,
          variant: "destructive",
        });
      } else {
        // Process check-in/out for client
        await processCheckInOut(clientData.id, clientData.full_name, barcode, clientData.client_code);
      }
    } catch (error) {
      console.error('Error processing barcode scan:', error);
      toast({
        title: "Scan Error",
        description: "Failed to process barcode scan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setBarcodeInput('');
      
      // Refocus input after processing
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);
    }
  };


  const processCheckInOut = async (clientId: string, userName: string, barcode: string, clientCode: string) => {
    try {
      // Check current status
      const { data: statusData, error: statusError } = await supabase.rpc('get_client_check_in_status', {
        p_client_id: clientId
      });

      if (statusError) {
        console.error('Error checking status:', statusError);
        // Default to checked_out if we can't determine status
      }

      const currentStatus = statusData || 'checked_out';
      const newAction = currentStatus === 'checked_in' ? 'check-out' : 'check-in';

      if (newAction === 'check-in') {
        // Create new check-in record
        const { error: checkInError } = await supabase
          .from('check_ins')
          .insert({
            client_id: clientId,
            user_id: clientId, // Temporary for compatibility
            status: 'checked_in',
            checked_in_at: new Date().toISOString(),
          });

        if (checkInError) throw checkInError;

        // Log the check-in
        const { error: logError } = await supabase
          .from('check_in_logs')
          .insert({
            client_id: clientId,
            scanned_barcode: barcode,
            action: 'check_in',
            timestamp: new Date().toISOString(),
          });

        if (logError) console.error('Error logging check-in:', logError);

        toast({
          title: "Check-in Successful",
          description: `${userName} has been checked in successfully.`,
        });
      } else {
        // Update existing check-in to checked out
        const { error: checkOutError } = await supabase
          .from('check_ins')
          .update({
            status: 'checked_out',
            checked_out_at: new Date().toISOString(),
          })
          .eq('client_id', clientId)
          .eq('status', 'checked_in');

        if (checkOutError) throw checkOutError;

        // Log the check-out
        const { error: logError } = await supabase
          .from('check_in_logs')
          .insert({
            client_id: clientId,
            scanned_barcode: barcode,
            action: 'check_out',
            timestamp: new Date().toISOString(),
          });

        if (logError) console.error('Error logging check-out:', logError);

        toast({
          title: "Check-out Successful",
          description: `${userName} has been checked out successfully.`,
        });
      }

      // Update scan result
      const result: ScanResult = {
        barcode,
        userName,
        action: newAction,
        timestamp: new Date(),
        clientId,
        clientCode,
      };

      setScanResult(result);
      setRecentScans(prev => [result, ...prev.slice(0, 4)]);

    } catch (error) {
      console.error('Error in check-in/out process:', error);
      toast({
        title: "Process Error",
        description: `Failed to process check-in/out for ${userName}.`,
        variant: "destructive",
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Barcode Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Barcode Scanner
          </CardTitle>
          <CardDescription>
            Scan client barcodes for check-in and check-out. Focus on the input field and scan or type the barcode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan or enter barcode here..."
              value={barcodeInput}
              onChange={(e) => handleBarcodeInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isProcessing}
              className="text-lg font-mono"
            />
            <div className="flex gap-2">
              <Button 
                onClick={() => handleScanResult(barcodeInput.trim())}
                disabled={!barcodeInput.trim() || isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : 'Process Scan'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setBarcodeInput('');
                  if (barcodeInputRef.current) {
                    barcodeInputRef.current.focus();
                  }
                }}
              >
                Clear
              </Button>
            </div>
          </div>
          
        </CardContent>
      </Card>

      {/* Scan Result Card */}
      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {scanResult.action === 'check-in' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-blue-500" />
              )}
              Latest Scan Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{scanResult.userName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Client ID: {scanResult.clientCode}</span>
                  </div>
                </div>
                <Badge variant={scanResult.action === 'check-in' ? 'default' : 'secondary'}>
                  {scanResult.action === 'check-in' ? 'CHECKED IN' : 'CHECKED OUT'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTime(scanResult.timestamp)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Scans Card */}
      {recentScans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>Last few check-in/out activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentScans.map((scan, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="space-y-1">
                    <div className="font-medium">{scan.userName}</div>
                    <div className="text-sm text-muted-foreground">{scan.clientCode}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge 
                      variant={scan.action === 'check-in' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {scan.action === 'check-in' ? 'IN' : 'OUT'}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(scan.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}