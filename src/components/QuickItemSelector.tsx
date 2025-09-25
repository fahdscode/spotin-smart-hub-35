import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Coffee, Clock, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  is_available: boolean;
  prep_time?: string;
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

interface QuickItemSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: Client | null;
  onItemSelect: (itemName: string) => void;
}

// Mock products data with prep times
const mockProducts: Product[] = [
  { id: "1", name: "Espresso", price: 25, category: "beverage", is_available: true, description: "Strong Italian coffee", prep_time: "2 min" },
  { id: "2", name: "Cappuccino", price: 35, category: "beverage", is_available: true, description: "Coffee with steamed milk foam", prep_time: "4 min" },
  { id: "3", name: "Americano", price: 30, category: "beverage", is_available: true, description: "Black coffee with hot water", prep_time: "3 min" },
  { id: "4", name: "Latte", price: 40, category: "beverage", is_available: true, description: "Coffee with steamed milk", prep_time: "4 min" },
  { id: "5", name: "Mocha", price: 45, category: "beverage", is_available: true, description: "Coffee with chocolate", prep_time: "5 min" },
  { id: "6", name: "Macchiato", price: 38, category: "beverage", is_available: true, description: "Espresso with a dollop of foam", prep_time: "3 min" },
  { id: "7", name: "Flat White", price: 42, category: "beverage", is_available: true, description: "Double shot with steamed milk", prep_time: "4 min" },
  { id: "8", name: "Croissant", price: 20, category: "food", is_available: true, description: "Buttery pastry", prep_time: "1 min" },
  { id: "9", name: "Sandwich", price: 50, category: "food", is_available: true, description: "Fresh deli sandwich", prep_time: "5 min" },
  { id: "10", name: "Muffin", price: 25, category: "snack", is_available: true, description: "Sweet baked treat", prep_time: "1 min" },
  { id: "11", name: "Cookies", price: 15, category: "snack", is_available: true, description: "Chocolate chip cookies", prep_time: "1 min" },
  { id: "12", name: "Cheesecake", price: 60, category: "dessert", is_available: true, description: "Rich creamy dessert", prep_time: "2 min" }
];

const mockCategories = [
  { value: "beverage", label: "Beverages", icon: "☕" },
  { value: "food", label: "Food", icon: "🍽️" },
  { value: "snack", label: "Snacks", icon: "🥨" },
  { value: "dessert", label: "Desserts", icon: "🧁" }
];

const QuickItemSelector = ({ isOpen, onClose, selectedClient, onItemSelect }: QuickItemSelectorProps) => {
  const [products] = useState<Product[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  const handleItemSelect = (itemName: string) => {
    onItemSelect(itemName);
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
            <Coffee className="h-5 w-5" />
            Quick Add Item
          </DialogTitle>
          <DialogDescription>
            {selectedClient 
              ? `Adding item for ${selectedClient.full_name} (${selectedClient.client_code})`
              : "Please select a client first"
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
                  placeholder="Search items..."
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
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categoryProducts.map((product) => (
                    <Card 
                      key={product.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleItemSelect(product.name)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{product.name}</CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {product.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {product.prep_time}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {product.price} EGP
                          </Badge>
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
              <p>No items found matching your search criteria.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickItemSelector;