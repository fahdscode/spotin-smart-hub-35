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

interface ToggleResult {
  success: boolean;
  error?: string;
  action?: string;
  debug?: any; // Add debug field
  client?: {
    id: string;
    client_code: string;
    full_name: string;
    phone: string;
    email: string;
    barcode: string;
    active: boolean;
  };
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
    
    // Auto-process when barcode is complete (BC- format or C- format for compatibility)
    if (value.length >= 10 && (value.startsWith('BC-') || value.startsWith('C-'))) {
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

    // Processing barcode scan

    try {
      // Use the new toggle function that handles trimming and concurrency
      const { data: result, error } = await supabase.rpc('toggle_client_checkin_status', {
        p_barcode: barcode,
        p_scanned_by_user_id: null // Could be current user ID if we track receptionist
      });

      if (error) {
        console.error('❌ RPC Error:', error);
        toast({
          title: "System Error",
          description: "System error. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const toggleResult = result as unknown as ToggleResult;
      
      if (!toggleResult?.success) {

        toast({
          title: "Invalid Barcode",
          description: toggleResult?.error || "Invalid barcode. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Success - update UI
      const client = toggleResult.client!;
      const action = toggleResult.action!;
      
      // Scan successful
      
      const scanResult: ScanResult = {
        barcode: client.barcode, // Use the actual barcode from DB
        userName: client.full_name,
        action: action === 'checked_in' ? 'check-in' : 'check-out',
        timestamp: new Date(),
        clientId: client.id,
        clientCode: client.client_code,
      };

      setScanResult(scanResult);
      setRecentScans(prev => [scanResult, ...prev.slice(0, 4)]);

      toast({
        title: action === 'checked_in' ? "Check-in Successful" : "Check-out Successful",
        description: `${client.full_name} has been ${action.replace('_', '-')} successfully.`,
      });

    } catch (error) {
      console.error('❌ Error processing barcode scan:', error);
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