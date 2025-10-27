import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Coffee, Clock, Package, StickyNote, XCircle } from "lucide-react";
import { useProductAvailability } from "@/hooks/useProductAvailability";
import { supabase } from "@/integrations/supabase/client";

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
  onItemSelect: (itemName: string, note?: string) => void;
  maxFreeDrinkPrice?: number;
  hasFreeDrink?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

const QuickItemSelector = ({ isOpen, onClose, selectedClient, onItemSelect, maxFreeDrinkPrice, hasFreeDrink }: QuickItemSelectorProps) => {
  const { products, loading } = useProductAvailability();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [itemNote, setItemNote] = useState("");

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setCategories(data);
      }
    };
    
    fetchCategories();
  }, []);

  useEffect(() => {
    // Filter products based on search term and category
    let filtered = products.filter(product => 
      product.is_available &&
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       product.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (selectedCategory !== "all") {
      // Case-insensitive category matching
      filtered = filtered.filter(product => 
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const handleItemSelect = (itemName: string) => {
    setSelectedItem(itemName);
  };

  const handleConfirmItem = () => {
    if (selectedItem) {
      onItemSelect(selectedItem, itemNote);
      setSelectedItem(null);
      setItemNote("");
      onClose();
    }
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
          {hasFreeDrink && maxFreeDrinkPrice && (
            <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 border-2 border-green-500 rounded-lg">
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-green-600 animate-bounce" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                    Free Drink Available! (Max: {maxFreeDrinkPrice.toFixed(2)} EGP)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Eligible drinks are highlighted with a green border
                  </p>
                </div>
              </div>
            </div>
          )}
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
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.name)}
                  className="gap-2"
                  size="sm"
                >
                  {category.icon && <span>{category.icon}</span>}
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {categories.find(c => c.name === category)?.name || category}
                    <Badge variant="outline">{categoryProducts.length} items</Badge>
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categoryProducts.map((product) => (
                      <Card 
                        key={product.id} 
                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                          selectedItem === product.name ? 'ring-2 ring-primary' : ''
                        } ${
                          hasFreeDrink && product.price <= (maxFreeDrinkPrice || 0) 
                            ? 'border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20' 
                            : ''
                        }`}
                        onClick={() => handleItemSelect(product.name)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between mb-1">
                            <CardTitle className="text-sm">{product.name}</CardTitle>
                            {hasFreeDrink && product.price <= (maxFreeDrinkPrice || 0) && (
                              <Badge className="bg-green-500 text-xs animate-pulse">FREE</Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs line-clamp-2">
                            {product.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              2-5 min
                            </div>
                            <div className="flex items-center gap-2">
                              {hasFreeDrink && product.price <= (maxFreeDrinkPrice || 0) && (
                                <span className="line-through text-muted-foreground">
                                  {product.price} EGP
                                </span>
                              )}
                              {!(hasFreeDrink && product.price <= (maxFreeDrinkPrice || 0)) && (
                                <Badge variant="secondary" className="text-xs">
                                  {product.price} EGP
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items found matching your search criteria.</p>
            </div>
          )}
        </div>

        {/* Item Confirmation with Note */}
        {selectedItem && (
          <div className="border-t pt-4 mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Selected: {selectedItem}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedItem(null);
                  setItemNote("");
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="itemNote" className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Add Note (Optional)
              </Label>
              <Textarea
                id="itemNote"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="Any special instructions or notes..."
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirmItem} className="flex-1">
                Add Item
              </Button>
              <Button 
                onClick={() => {
                  setSelectedItem(null);
                  setItemNote("");
                }} 
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickItemSelector;