import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Minus, ShoppingCart, Package, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  is_available: boolean;
  image_url?: string;
}

interface Client {
  id: string;
  client_code: string;
  full_name: string;
  phone: string;
  email?: string;
  active: boolean;
  barcode?: string;
}

interface ClientProductEditorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: Client | null;
}

// Mock products data
const mockProducts: Product[] = [
  { id: "1", name: "Espresso", price: 25, category: "beverage", is_available: true, description: "Strong Italian coffee" },
  { id: "2", name: "Cappuccino", price: 35, category: "beverage", is_available: true, description: "Coffee with steamed milk foam" },
  { id: "3", name: "Americano", price: 30, category: "beverage", is_available: true, description: "Black coffee with hot water" },
  { id: "4", name: "Latte", price: 40, category: "beverage", is_available: true, description: "Coffee with steamed milk" },
  { id: "5", name: "Mocha", price: 45, category: "beverage", is_available: true, description: "Coffee with chocolate" },
  { id: "6", name: "Croissant", price: 20, category: "food", is_available: true, description: "Buttery pastry" },
  { id: "7", name: "Sandwich", price: 50, category: "food", is_available: true, description: "Fresh deli sandwich" },
  { id: "8", name: "Muffin", price: 25, category: "snack", is_available: true, description: "Sweet baked treat" },
  { id: "9", name: "Cookies", price: 15, category: "snack", is_available: true, description: "Chocolate chip cookies" },
  { id: "10", name: "Cheesecake", price: 60, category: "dessert", is_available: true, description: "Rich creamy dessert" }
];

const mockCategories = [
  { value: "beverage", label: "Beverages", icon: "☕" },
  { value: "food", label: "Food", icon: "🍽️" },
  { value: "snack", label: "Snacks", icon: "🥨" },
  { value: "dessert", label: "Desserts", icon: "🧁" }
];

const ClientProductEditor = ({ isOpen, onClose, selectedClient }: ClientProductEditorProps) => {
  const [products] = useState<Product[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    // Filter products based on search term and category
    let filtered = products.filter(product => 
      product.is_available &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       product.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };

  const submitOrder = () => {
    if (!selectedClient) {
      toast({
        title: "No Client Selected",
        description: "Please select a client first",
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(cart).length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart first",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally submit the order to your backend
    toast({
      title: "Order Submitted",
      description: `Order for ${selectedClient.full_name} has been submitted successfully`,
    });

    setCart({});
    onClose();
  };

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Client Products
          </DialogTitle>
          <DialogDescription>
            {selectedClient 
              ? `Managing products for ${selectedClient.full_name} (${selectedClient.client_code})`
              : "No client selected"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Search and Filter */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-48">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                  className="w-full"
                >
                  All Categories
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {mockCategories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.value)}
                  className="gap-2"
                  size="sm"
                >
                  <span>{category.icon}</span>
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="space-y-6">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {mockCategories.find(c => c.value === category)?.label || category}
                  <Badge variant="outline">{categoryProducts.length} items</Badge>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryProducts.map((product) => (
                    <Card key={product.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm">{product.name}</CardTitle>
                            <CardDescription className="text-xs line-clamp-1">
                              {product.description}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {product.price} EGP
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(product.id)}
                              disabled={!cart[product.id]}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="min-w-[20px] text-center font-medium">
                              {cart[product.id] || 0}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addToCart(product.id)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="professional"
                            onClick={() => addToCart(product.id)}
                          >
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products found matching your search criteria.</p>
            </div>
          )}
        </div>

        {/* Cart Summary and Actions */}
        {Object.keys(cart).length > 0 && (
          <Card className="mt-4 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart Summary ({getCartItemCount()} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 max-h-20 overflow-y-auto">
                {Object.entries(cart).map(([productId, quantity]) => {
                  const product = products.find(p => p.id === productId);
                  if (!product) return null;
                  return (
                    <div key={productId} className="flex items-center justify-between text-sm">
                      <span>{product.name} x{quantity}</span>
                      <span className="font-medium">{product.price * quantity} EGP</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-2 flex items-center justify-between font-semibold">
                <span>Total:</span>
                <span>{getCartTotal()} EGP</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCart({})} className="flex-1">
                  Clear Cart
                </Button>
                <Button variant="professional" onClick={submitOrder} className="flex-1">
                  Submit Order
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientProductEditor;