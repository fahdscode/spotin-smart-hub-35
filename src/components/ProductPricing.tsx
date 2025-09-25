import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Save, X, DollarSign, Package, Trash2, Upload, Image } from "lucide-react";
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
  image_url?: string;
  prep_time?: string;
}

const ProductPricing = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    category: "beverage",
    description: "",
    is_available: true,
    image_url: "",
    prep_time: "",
    ingredients: [] as string[]
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
          is_available: newProduct.is_available,
          image_url: newProduct.image_url || null,
          ingredients: newProduct.ingredients.length > 0 ? newProduct.ingredients : null
        }])
        .select();

      if (error) throw error;

      setProducts([...products, data[0]]);
      setNewProduct({
        name: "",
        price: 0,
        category: "beverage",
        description: "",
        is_available: true,
        image_url: "",
        prep_time: "",
        ingredients: []
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

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('drinks')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));

      toast({
        title: "Product Deleted",
        description: "Product has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
    }
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
                  <div>
                    <Label htmlFor="productPrepTime">Avg. Prep Time</Label>
                    <Input
                      id="productPrepTime"
                      value={newProduct.prep_time}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, prep_time: e.target.value }))}
                      placeholder="e.g., 5 min"
                    />
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
                  <Label htmlFor="productDescription">Description</Label>
                  <Textarea
                    id="productDescription"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Product description..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="productIngredients">Ingredients (comma-separated)</Label>
                  <Textarea
                    id="productIngredients"
                    value={newProduct.ingredients.join(", ")}
                    onChange={(e) => setNewProduct(prev => ({ 
                      ...prev, 
                      ingredients: e.target.value.split(",").map(ing => ing.trim()).filter(Boolean)
                    }))}
                    placeholder="e.g., Coffee beans, Milk, Sugar"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="productImage">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="productImage"
                      value={newProduct.image_url}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {newProduct.image_url && (
                    <div className="mt-2">
                      <img
                        src={newProduct.image_url}
                        alt="Product preview"
                        className="w-20 h-20 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
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
                  <Card key={product.id} className={`${!product.is_available ? 'opacity-60' : ''} relative group`}>
                    {product.image_url && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.is_available}
                            onCheckedChange={(checked) => handleToggleAvailability(product.id, checked)}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {product.description && (
                        <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {editingProduct === product.id ? (
                          <div className="space-y-3">
                            <div>
                              <Label>Price (EGP)</Label>
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
                            </div>
                            <div>
                              <Label>Avg. Prep Time</Label>
                              <Input
                                value={product.prep_time || ""}
                                onChange={(e) => {
                                  setProducts(products.map(p => 
                                    p.id === product.id ? { ...p, prep_time: e.target.value } : p
                                  ));
                                }}
                                placeholder="e.g., 5 min"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={product.description || ""}
                                onChange={(e) => {
                                  setProducts(products.map(p => 
                                    p.id === product.id ? { ...p, description: e.target.value } : p
                                  ));
                                }}
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label>Ingredients (comma-separated)</Label>
                              <Textarea
                                value={product.ingredients?.join(", ") || ""}
                                onChange={(e) => {
                                  const ingredients = e.target.value.split(",").map(ing => ing.trim()).filter(Boolean);
                                  setProducts(products.map(p => 
                                    p.id === product.id ? { ...p, ingredients } : p
                                  ));
                                }}
                                rows={2}
                                placeholder="e.g., Coffee beans, Milk, Sugar"
                              />
                            </div>
                            <div>
                              <Label>Image URL</Label>
                              <Input
                                value={product.image_url || ""}
                                onChange={(e) => {
                                  setProducts(products.map(p => 
                                    p.id === product.id ? { ...p, image_url: e.target.value } : p
                                  ));
                                }}
                                placeholder="https://example.com/image.jpg"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleUpdateProduct(product.id, { 
                                    price: product.price,
                                    description: product.description,
                                    image_url: product.image_url,
                                    prep_time: product.prep_time,
                                    ingredients: product.ingredients
                                  });
                                  setEditingProduct(null);
                                }}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingProduct(null);
                                  fetchProducts(); // Reset changes
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-xl font-bold text-primary">
                                {formatPrice(product.price)}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingProduct(product.id)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                            
                            <Badge variant={product.is_available ? "default" : "secondary"}>
                              {product.is_available ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                        )}
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