import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Copy, Check } from "lucide-react";
import QRCode from "qrcode";
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
      generateQRCode();
    }
  }, [barcode, clientCode]);

  // Don't render if required props are missing
  if (!clientCode || !userName) {
    return (
      <Card className="border-2 border-gray-200 bg-gray-50">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500">Loading QR code...</p>
            <div className="text-xs text-muted-foreground mt-2">
              Missing: {!clientCode && 'Client Code'} {!userName && 'User Name'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const generateQRCode = async () => {
    try {
      if (canvasRef.current && (barcode || clientCode)) {
        const qrValue = barcode || clientCode;
        const canvas = canvasRef.current;
        
        await QRCode.toCanvas(canvas, qrValue, {
          width: 200,
          margin: 2,
          color: {
            dark: '#059669',
            light: '#ffffff'
          }
        });
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "QR Code Error",
        description: "Failed to generate QR code. Please refresh the page.",
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

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const qrValue = barcode || clientCode;
      const link = document.createElement('a');
      link.download = `spotin-qrcode-${qrValue}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
      toast({
        title: "QR Code Downloaded!",
        description: "Your QR code has been saved to your device",
      });
    }
  };

  const printQRCode = () => {
    if (canvasRef.current) {
      const qrValue = barcode || clientCode;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>SpotIn Client QR Code - ${qrValue}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 20px;
                  background: white;
                }
                .header { margin-bottom: 20px; }
                .qrcode { margin: 20px 0; }
                .info { margin-top: 20px; font-size: 14px; color: #666; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>SpotIn Coworking</h1>
                <h2>Client Check-in QR Code</h2>
              </div>
              <div class="qrcode">
                <img src="${canvasRef.current.toDataURL()}" alt="Client QR Code" />
              </div>
              <div class="info">
                <p><strong>Client:</strong> ${userName}</p>
                <p><strong>Client ID:</strong> ${clientCode}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p>Show this QR code to reception for quick check-in/out</p>
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
          <CardTitle className="text-xl text-green-700">Your Check-in QR Code</CardTitle>
        </div>
        <CardDescription className="text-green-600">
          Show this QR code to reception for instant check-in
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

        {/* Client Info */}
        <div className="space-y-3 text-center">
          <div>
            <p className="text-sm text-muted-foreground">{barcode ? 'QR Code' : 'Client ID'}</p>
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
            onClick={downloadQRCode}
            variant="outline"
            size="default"
            className="w-full h-12 text-sm font-medium"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={printQRCode}
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
            <li>• Show this QR code to reception for check-in</li>
            <li>• Or share the {barcode ? 'QR code' : 'client ID'}: <code>{barcode || clientCode}</code></li>
            <li>• Scan again when leaving to check-out</li>
            <li>• Keep this QR code safe and don't share with others</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeCard;