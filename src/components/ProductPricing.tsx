import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Save, X, DollarSign, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  is_available: boolean;
  ingredients?: string[];
}

const ProductPricing = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    category: "beverage",
    description: "",
    is_available: true
  });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const categories = [
    { value: "beverage", label: "Beverages" },
    { value: "food", label: "Food" },
    { value: "snack", label: "Snacks" },
    { value: "dessert", label: "Desserts" }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter valid product name and price",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('drinks')
        .insert([{
          name: newProduct.name,
          price: newProduct.price,
          category: newProduct.category,
          description: newProduct.description || null,
          is_available: newProduct.is_available
        }])
        .select();

      if (error) throw error;

      setProducts([...products, data[0]]);
      setNewProduct({
        name: "",
        price: 0,
        category: "beverage",
        description: "",
        is_available: true
      });
      setIsAddingProduct(false);

      toast({
        title: "Product Added",
        description: `${newProduct.name} has been added successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('drinks')
        .update(updates)
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(p => 
        p.id === productId ? { ...p, ...updates } : p
      ));

      toast({
        title: "Product Updated",
        description: "Product has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating product",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleAvailability = async (productId: string, isAvailable: boolean) => {
    await handleUpdateProduct(productId, { is_available: isAvailable });
  };

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Pricing</CardTitle>
          <CardDescription>Loading products...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Product Pricing Management
            </CardTitle>
            <CardDescription>Manage product prices and availability</CardDescription>
          </div>
          <Button 
            onClick={() => setIsAddingProduct(true)}
            variant="professional"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          {/* Add New Product Form */}
          {isAddingProduct && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Add New Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Premium Coffee"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productPrice">Price (EGP)</Label>
                    <Input
                      id="productPrice"
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productCategory">Category</Label>
                    <Select
                      value={newProduct.category}
                      onValueChange={(value) => setNewProduct(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="available"
                      checked={newProduct.is_available}
                      onCheckedChange={(checked) => setNewProduct(prev => ({ ...prev, is_available: checked }))}
                    />
                    <Label htmlFor="available">Available</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="productDescription">Description (optional)</Label>
                  <Input
                    id="productDescription"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Product description..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddProduct} variant="professional">
                    <Save className="h-4 w-4 mr-2" />
                    Save Product
                  </Button>
                  <Button onClick={() => setIsAddingProduct(false)} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products by Category */}
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                {categories.find(c => c.value === category)?.label || category}
                <Badge variant="outline">{categoryProducts.length} items</Badge>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryProducts.map((product) => (
                  <Card key={product.id} className={`${!product.is_available ? 'opacity-60' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <Switch
                          checked={product.is_available}
                          onCheckedChange={(checked) => handleToggleAvailability(product.id, checked)}
                        />
                      </div>
                      {product.description && (
                        <CardDescription>{product.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {editingProduct === product.id ? (
                          <div className="space-y-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={product.price}
                              onChange={(e) => {
                                const newPrice = parseFloat(e.target.value) || 0;
                                setProducts(products.map(p => 
                                  p.id === product.id ? { ...p, price: newPrice } : p
                                ));
                              }}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleUpdateProduct(product.id, { price: product.price });
                                  setEditingProduct(null);
                                }}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingProduct(null);
                                  fetchProducts(); // Reset changes
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="text-xl font-bold text-primary">
                              {formatPrice(product.price)}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingProduct(product.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        
                        <Badge variant={product.is_available ? "default" : "secondary"}>
                          {product.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products found. Add your first product to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductPricing;