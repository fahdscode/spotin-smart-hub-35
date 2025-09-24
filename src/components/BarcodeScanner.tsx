import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scan, QrCode, UserCheck, UserX, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  barcode: string;
  userName: string;
  action: 'check-in' | 'check-out';
  timestamp: string;
}

const BarcodeScanner = () => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Demo barcodes for testing
  const demoBarcodes = {
    "CLIENT12345": "Demo Client",
    "BC123456": "John Smith", 
    "BC789012": "Sarah Johnson",
    "BC345678": "Mike Chen"
  };

  useEffect(() => {
    // Focus on the barcode input when component mounts
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const handleBarcodeInput = (value: string) => {
    setBarcodeInput(value);
    
    // Auto-process when barcode is complete (typically 8+ characters)
    if (value.length >= 8) {
      handleScanResult(value);
      setBarcodeInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      handleScanResult(barcodeInput.trim());
      setBarcodeInput("");
    }
  };

  const handleScanResult = async (barcode: string) => {
    try {
      // Check if it's a demo barcode first
      if (demoBarcodes[barcode]) {
        await processCheckInOut(barcode, demoBarcodes[barcode]);
        return;
      }

      // Check database for real user
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, barcode')
        .eq('barcode', barcode)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Database Error",
          description: "Could not verify barcode",
          variant: "destructive",
        });
        return;
      }

      if (!profile) {
        toast({
          title: "Invalid Barcode",
          description: "Barcode not found in system",
          variant: "destructive",
        });
        return;
      }

      await processCheckInOut(barcode, profile.full_name || 'Unknown User');
      
    } catch (error) {
      console.error('Error processing scan:', error);
      toast({
        title: "Scan Error", 
        description: "Could not process barcode scan",
        variant: "destructive",
      });
    }
  };

  const processCheckInOut = async (barcode: string, userName: string) => {
    try {
      // Check current check-in status
      const { data: existingCheckIn, error: checkError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', `barcode-${barcode}`) // Using barcode as temp user ID for demo
        .eq('status', 'checked_in')
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let action: 'check-in' | 'check-out';
      
      if (existingCheckIn) {
        // User is already checked in, so check them out
        const { error: updateError } = await supabase
          .from('check_ins')
          .update({ 
            status: 'checked_out',
            checked_out_at: new Date().toISOString()
          })
          .eq('id', existingCheckIn.id);

        if (updateError) throw updateError;
        action = 'check-out';
        
        toast({
          title: "Check-out Successful!",
          description: `${userName} has been checked out`,
        });
      } else {
        // User is not checked in, so check them in
        const { error: insertError } = await supabase
          .from('check_ins')
          .insert({
            user_id: `barcode-${barcode}`, // Using barcode as temp user ID
            status: 'checked_in',
            checked_in_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
        action = 'check-in';
        
        toast({
          title: "Check-in Successful!",
          description: `${userName} has been checked in`,
        });
      }

      // Add to scan results
      const result: ScanResult = {
        barcode,
        userName,
        action,
        timestamp: new Date().toISOString()
      };

      setScanResult(result);
      setRecentScans(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 scans
      
    } catch (error) {
      console.error('Error processing check-in/out:', error);
      toast({
        title: "Processing Error",
        description: "Could not update check-in status",
        variant: "destructive",
      });
    }
  };

  const handleManualScan = () => {
    if (barcodeInput.trim()) {
      handleScanResult(barcodeInput.trim());
      setBarcodeInput("");
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Scanner Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-slate-50 to-blue-50">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scan className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-xl text-blue-700">Barcode Reader</CardTitle>
          </div>
          <CardDescription className="text-blue-600">
            Use barcode reader device or manual entry for check-in/out
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Barcode Input */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-blue-100 p-8 rounded-lg border-2 border-dashed border-blue-300">
                <Scan className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-700 mb-2">Ready to Scan</h3>
                <p className="text-blue-600">Use your barcode reader device or type manually below</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-700">Barcode Scanner Input</label>
              <Input
                ref={barcodeInputRef}
                placeholder="Scan barcode here or type manually..."
                value={barcodeInput}
                onChange={(e) => handleBarcodeInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-14 text-lg text-center border-2 border-blue-200 focus:border-blue-500 transition-colors"
                autoFocus
              />
              <p className="text-xs text-blue-600 text-center">
                Barcode will be processed automatically or press Enter
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleManualScan}
                disabled={!barcodeInput.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Process Barcode
              </Button>
              <Button
                onClick={() => {
                  setBarcodeInput("");
                  barcodeInputRef.current?.focus();
                }}
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                size="lg"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Demo Barcodes */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-blue-700">
              <strong>Demo Barcodes:</strong> Try CLIENT12345, BC123456, BC789012, or BC345678
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Scan Result */}
      {scanResult && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                scanResult.action === 'check-in' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {scanResult.action === 'check-in' ? (
                  <UserCheck className="h-6 w-6" />
                ) : (
                  <UserX className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{scanResult.userName}</p>
                <p className="text-sm text-muted-foreground">
                  {scanResult.action === 'check-in' ? 'Checked In' : 'Checked Out'} • {formatTime(scanResult.timestamp)}
                </p>
                <p className="text-xs text-muted-foreground">Barcode: {scanResult.barcode}</p>
              </div>
              <Badge variant={scanResult.action === 'check-in' ? 'default' : 'secondary'}>
                {scanResult.action.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Scans
            </CardTitle>
            <CardDescription>Latest check-in/out activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentScans.map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{scan.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {scan.barcode} • {formatTime(scan.timestamp)}
                    </p>
                  </div>
                  <Badge variant={scan.action === 'check-in' ? 'default' : 'secondary'}>
                    {scan.action === 'check-in' ? 'IN' : 'OUT'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BarcodeScanner;