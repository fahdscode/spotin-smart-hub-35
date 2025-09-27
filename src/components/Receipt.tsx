import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt as ReceiptIcon, Download, Mail, Check } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { toast } from "sonner";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptProps {
  receiptNumber?: string;
  customerName?: string;
  items?: ReceiptItem[];
  subtotal?: number;
  discount?: number;
  total?: number;
  paymentMethod?: string;
  date?: string;
}

const Receipt = ({ 
  receiptNumber = "RCP-2024-001",
  customerName = "Demo Customer",
  items = [
    { name: "Coffee - Large", quantity: 2, price: 45.00, total: 90.00 },
    { name: "Meeting Room - 1hr", quantity: 1, price: 300.00, total: 300.00 },
    { name: "Day Use Pass", quantity: 1, price: 500.00, total: 500.00 }
  ],
  subtotal = 890.00,
  discount = 89.00,
  total = 801.00,
  paymentMethod = "Credit Card",
  date = new Date().toLocaleDateString()
}: ReceiptProps) => {
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailReceipt = () => {
    // TODO: Implement email functionality
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const handleDownload = () => {
    // TODO: Implement PDF download functionality
    toast("PDF download feature coming soon!");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ReceiptIcon className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">SpotIn Receipt</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Your coworking space transaction
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Receipt Header */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receipt #:</span>
            <span className="font-mono">{receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span>{customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span>{date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment:</span>
            <Badge variant="outline">{paymentMethod}</Badge>
          </div>
        </div>

        <Separator />

        {/* Items */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Items</h3>
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-start text-sm">
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-muted-foreground">
                  {formatPrice(item.price)} × {item.quantity}
                </div>
              </div>
              <div className="font-mono">{formatPrice(item.total)}</div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono">{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Member Discount (10%):</span>
              <span className="font-mono">-{formatPrice(discount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span className="font-mono">{formatPrice(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleEmailReceipt}
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={emailSent}
          >
            {emailSent ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Sent!
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Email
              </>
            )}
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          Thank you for choosing SpotIn!<br />
          Visit us again soon.
        </div>
      </CardContent>
    </Card>
  );
};

export default Receipt;