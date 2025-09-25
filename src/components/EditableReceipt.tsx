import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt as ReceiptIcon, Plus, Minus, Trash2 } from "lucide-react";

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  category: 'product' | 'room' | 'ticket';
}

interface EditableReceiptProps {
  receiptNumber?: string;
  customerName?: string;
  sessionDuration?: number;
  sessionCost?: number;
  onConfirm: (items: ReceiptItem[], total: number, paymentMethod: string) => void;
  onCancel: () => void;
}

const EditableReceipt = ({ 
  receiptNumber = "RCP-2024-001",
  customerName = "Demo Customer",
  sessionDuration = 2,
  sessionCost = 30.00,
  onConfirm,
  onCancel
}: EditableReceiptProps) => {
  const [items, setItems] = useState<ReceiptItem[]>([
    {
      id: "session",
      name: `Coworking Session (${sessionDuration}h)`,
      quantity: 1,
      price: sessionCost,
      total: sessionCost,
      category: 'ticket'
    }
  ]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  
  const availableItems = [
    { name: "Coffee - Small", price: 3.50, category: 'product' as const },
    { name: "Coffee - Large", price: 4.50, category: 'product' as const },
    { name: "Tea", price: 3.00, category: 'product' as const },
    { name: "Sandwich", price: 8.50, category: 'product' as const },
    { name: "Pastry", price: 5.00, category: 'product' as const },
    { name: "Meeting Room - 1hr", price: 15.00, category: 'room' as const },
    { name: "Phone Booth - 30min", price: 8.00, category: 'room' as const },
    { name: "Event Ticket", price: 20.00, category: 'ticket' as const },
  ];

  const addItem = (itemName: string) => {
    const availableItem = availableItems.find(item => item.name === itemName);
    if (!availableItem) return;

    const existingItem = items.find(item => item.name === itemName);
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: ReceiptItem = {
        id: Date.now().toString(),
        name: availableItem.name,
        quantity: 1,
        price: availableItem.price,
        total: availableItem.price,
        category: availableItem.category
      };
      setItems(prev => [...prev, newItem]);
    }
  };

  const removeItem = (id: string) => {
    if (id === "session") return; // Can't remove session item
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (id === "session" && newQuantity < 1) return; // Session must have at least 1
    if (newQuantity < 0) return;
    
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
        : item
    ).filter(item => item.quantity > 0));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = subtotal * 0.1; // 10% member discount
  const total = subtotal - discount;

  const handleConfirm = () => {
    if (!paymentMethod) return;
    onConfirm(items, total, paymentMethod);
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ReceiptIcon className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">Edit Receipt</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Add or remove items before checkout
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
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
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <Separator />

          {/* Add Items Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Add Items</h3>
            <Select onValueChange={addItem}>
              <SelectTrigger>
                <SelectValue placeholder="Select item to add" />
              </SelectTrigger>
              <SelectContent>
                {availableItems.map((item) => (
                  <SelectItem key={item.name} value={item.name}>
                    {item.name} - ${item.price.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Current Items */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Items</h3>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm bg-muted/30 p-3 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-muted-foreground">
                    ${item.price.toFixed(2)} each
                  </div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {item.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.id === "session" && item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  {item.id !== "session" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="font-mono ml-4">${item.total.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-success">
              <span>Member Discount (10%):</span>
              <span className="font-mono">-${discount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Payment Method</h3>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="visa">Visa Card</SelectItem>
                <SelectItem value="mastercard">Mastercard</SelectItem>
                <SelectItem value="amex">American Express</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1"
              disabled={!paymentMethod}
            >
              Confirm Checkout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditableReceipt;