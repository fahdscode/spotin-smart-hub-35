import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt as ReceiptIcon, Plus, Minus, Trash2, Search, AlertTriangle, PackageX } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { useProductAvailability } from "@/hooks/useProductAvailability";
import { useToast } from "@/hooks/use-toast";

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
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const { products, loading: productsLoading, checkIngredientAvailability } = useProductAvailability();
  const { toast } = useToast();
  
  // Static items for rooms and other services
  const staticItems = [
    { id: "room-1hr", name: "Meeting Room - 1hr", price: 300.00, category: 'room' as const, can_make: true },
    { id: "booth-30min", name: "Phone Booth - 30min", price: 160.00, category: 'room' as const, can_make: true },
    { id: "event-ticket", name: "Event Ticket", price: 400.00, category: 'ticket' as const, can_make: true }
  ];

  // Combine database products with static items
  const availableItems = [
    ...products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: 'product' as const,
      can_make: p.can_make,
      missing_ingredients: p.missing_ingredients,
      description: p.description
    })),
    ...staticItems
  ];

  const addItem = async (itemName: string) => {
    const availableItem = availableItems.find(item => item.name === itemName);
    if (!availableItem) return;

    // Check if it's a product and if ingredients are available
    if (availableItem.category === 'product' && availableItem.id && !availableItem.can_make) {
      toast({
        title: "Item Unavailable",
        description: `${itemName} cannot be made due to insufficient ingredients: ${availableItem.missing_ingredients?.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    const existingItem = items.find(item => item.name === itemName);
    if (existingItem) {
      // Check ingredient availability for the new quantity
      if (availableItem.category === 'product' && availableItem.id) {
        const canMake = await checkIngredientAvailability(availableItem.id, existingItem.quantity + 1);
        if (!canMake) {
          toast({
            title: "Insufficient Ingredients",
            description: `Cannot add more ${itemName} due to insufficient ingredients`,
            variant: "destructive",
          });
          return;
        }
      }
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: ReceiptItem = {
        id: availableItem.id || Date.now().toString(),
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
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select onValueChange={(value) => {
              addItem(value);
              setSearchTerm(""); // Clear search after adding
            }}>
              <SelectTrigger className="bg-popover border-input">
                <SelectValue placeholder="Select item to add" />
              </SelectTrigger>
               <SelectContent className="bg-popover border-input z-50">
                {availableItems
                  .filter(item => 
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.category.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((item) => (
                    <SelectItem 
                      key={item.name} 
                      value={item.name} 
                      className="hover:bg-accent"
                      disabled={item.category === 'product' && !item.can_make}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.category === 'product' && !item.can_make && (
                            <div className="flex items-center gap-1">
                              <PackageX className="h-3 w-3 text-destructive" />
                              <Badge variant="outline" className="text-xs text-destructive border-destructive">
                                Out of Stock
                              </Badge>
                            </div>
                          )}
                        </div>
                        <span className="text-muted-foreground">{formatPrice(item.price)}</span>
                      </div>
                    </SelectItem>
                  ))}
                {availableItems.filter(item => 
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.category.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && searchTerm && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No items found matching "{searchTerm}"
                  </div>
                )}
                {productsLoading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Loading products...
                  </div>
                )}
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
                    {formatPrice(item.price)} each
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
                <div className="font-mono ml-4">{formatPrice(item.total)}</div>
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
            <div className="flex justify-between text-success">
              <span>Member Discount (10%):</span>
              <span className="font-mono">-{formatPrice(discount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span className="font-mono">{formatPrice(total)}</span>
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