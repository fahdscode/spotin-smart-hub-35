import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Copy, Check } from "lucide-react";
import QRCode from "qrcode";
import { useToast } from "@/hooks/use-toast";

interface BarcodeCardProps {
  userBarcode?: string;
  userName?: string;
  userEmail?: string;
}

const BarcodeCard = ({ 
  userBarcode = "CLIENT12345", 
  userName = "Demo Client",
  userEmail = "demo@spotin.com"
}: BarcodeCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (canvasRef.current && userBarcode) {
      generateQRCode();
    }
  }, [userBarcode]);

  const generateQRCode = async () => {
    try {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, userBarcode, {
          width: 200,
          margin: 2,
          color: {
            dark: '#059669', // Green color for the QR code
            light: '#FFFFFF'
          }
        });
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const copyBarcode = async () => {
    try {
      await navigator.clipboard.writeText(userBarcode);
      setCopied(true);
      toast({
        title: "Barcode Copied!",
        description: "Your barcode has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy barcode to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `spotin-barcode-${userBarcode}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
      toast({
        title: "QR Code Downloaded!",
        description: "Your barcode has been saved to your device",
      });
    }
  };

  return (
    <Card className="border-2 border-gradient-to-r from-green-200 to-orange-200 bg-gradient-to-br from-green-50 to-orange-50">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <QrCode className="h-6 w-6 text-green-600" />
          <CardTitle className="text-xl text-green-700">Your Check-in Barcode</CardTitle>
        </div>
        <CardDescription className="text-green-600">
          Show this to reception for instant check-in
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg shadow-inner border-2 border-green-100">
            <canvas 
              ref={canvasRef}
              className="block"
            />
          </div>
        </div>

        {/* Barcode Info */}
        <div className="space-y-3 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Barcode ID</p>
            <div className="flex items-center justify-center gap-2 bg-white/80 rounded-lg p-3 border border-green-200">
              <code className="font-mono text-lg font-bold text-green-700">{userBarcode}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyBarcode}
                className="h-6 w-6 p-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-green-600" />
                )}
              </Button>
            </div>
          </div>

          <div className="text-sm text-green-600">
            <p><strong>{userName}</strong></p>
            <p>{userEmail}</p>
          </div>

          <Badge variant="secondary" className="bg-green-100 text-green-700 border border-green-300">
            Ready for Scanning
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={downloadQRCode}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={copyBarcode}
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy ID
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-white/80 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">How to use:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Show this QR code to reception</li>
            <li>• Or share the barcode ID: <code>{userBarcode}</code></li>
            <li>• Scan again when leaving to check-out</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeCard;