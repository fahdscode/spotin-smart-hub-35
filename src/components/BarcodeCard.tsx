import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Copy, Check } from "lucide-react";
import JsBarcode from "jsbarcode";
import { useToast } from "@/hooks/use-toast";

interface BarcodeCardProps {
  clientCode?: string;
  barcode?: string; // Add the actual barcode field
  userName?: string;
  userEmail?: string;
}

const BarcodeCard = ({ 
  clientCode, 
  barcode,
  userName,
  userEmail
}: BarcodeCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (canvasRef.current && (barcode || clientCode)) {
      generateBarcode();
    }
  }, [barcode, clientCode]);

  // Don't render if required props are missing
  if (!clientCode || !userName) {
    return (
      <Card className="border-2 border-gray-200 bg-gray-50">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500">Loading barcode...</p>
            <div className="text-xs text-muted-foreground mt-2">
              Missing: {!clientCode && 'Client Code'} {!userName && 'User Name'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const generateBarcode = () => {
    try {
      if (canvasRef.current && (barcode || clientCode)) {
        // Use the actual barcode if available, otherwise fall back to client code
        const barcodeValue = barcode || clientCode;
        
        JsBarcode(canvasRef.current, barcodeValue, {
          format: "CODE128",
          width: 2,
          height: 100,
          displayValue: true,
          text: barcodeValue,
          textAlign: "center",
          textPosition: "bottom",
          fontSize: 12,
          textMargin: 8,
          background: "#ffffff",
          lineColor: "#059669",
          margin: 10,
        });
      }
    } catch (error) {
      console.error('Error generating barcode:', error);
      toast({
        title: "Barcode Error",
        description: "Failed to generate barcode. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const copyClientCode = async () => {
    try {
      const valueToCopy = barcode || clientCode;
      await navigator.clipboard.writeText(valueToCopy);
      setCopied(true);
      toast({
        title: "Client ID Copied!",
        description: "Your client ID has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy client ID to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadBarcode = () => {
    if (canvasRef.current) {
      const barcodeValue = barcode || clientCode;
      const link = document.createElement('a');
      link.download = `spotin-barcode-${barcodeValue}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
      toast({
        title: "Barcode Downloaded!",
        description: "Your barcode has been saved to your device",
      });
    }
  };

  const printBarcode = () => {
    if (canvasRef.current) {
      const barcodeValue = barcode || clientCode;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>SpotIn Client Barcode - ${barcodeValue}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 20px;
                  background: white;
                }
                .header { margin-bottom: 20px; }
                .barcode { margin: 20px 0; }
                .info { margin-top: 20px; font-size: 14px; color: #666; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>SpotIn Coworking</h1>
                <h2>Client Check-in Barcode</h2>
              </div>
              <div class="barcode">
                <img src="${canvasRef.current.toDataURL()}" alt="Client Barcode" />
              </div>
              <div class="info">
                <p><strong>Client:</strong> ${userName}</p>
                <p><strong>Client ID:</strong> ${clientCode}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p>Show this barcode to reception for quick check-in/out</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
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
        {/* Barcode Display */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg shadow-inner border-2 border-green-100">
            <canvas 
              ref={canvasRef}
              className="block"
            />
          </div>
        </div>

        {/* Client Info */}
        <div className="space-y-3 text-center">
          <div>
            <p className="text-sm text-muted-foreground">{barcode ? 'Barcode' : 'Client ID'}</p>
            <div className="flex items-center justify-center gap-2 bg-white/80 rounded-lg p-3 border border-green-200">
              <code className="font-mono text-lg font-bold text-green-700">{barcode || clientCode}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyClientCode}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={downloadBarcode}
            variant="outline"
            size="default"
            className="w-full h-12 text-sm font-medium"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={printBarcode}
            variant="outline"
            size="default"
            className="w-full h-12 text-sm font-medium"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={copyClientCode}
            variant="outline"
            size="default"
            className="w-full h-12 text-sm font-medium"
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
            <li>• Show this barcode to reception for check-in</li>
            <li>• Or share the {barcode ? 'barcode' : 'client ID'}: <code>{barcode || clientCode}</code></li>
            <li>• Scan again when leaving to check-out</li>
            <li>• Keep this barcode safe and don't share with others</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeCard;