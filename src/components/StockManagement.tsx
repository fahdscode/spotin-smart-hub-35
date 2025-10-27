import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Package, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StockItem {
  id: string;
  name: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  cost_per_unit: number;
  supplier?: string;
  category: string;
  is_active: boolean;
}

const StockManagement = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState({
    name: "",
    unit: "kg",
    current_quantity: 0,
    min_quantity: 0,
    cost_per_unit: 0,
    supplier: "",
    category: "ingredient"
  });
  const [editStock, setEditStock] = useState<StockItem | null>(null);
  const { toast } = useToast();

  const units = [
    { value: "kg", label: "Kilograms" },
    { value: "grams", label: "Grams" },
    { value: "liter", label: "Liters" },
    { value: "piece", label: "Pieces" },
    { value: "ml", label: "Milliliters" },
    { value: "can", label: "Cans" }
  ];

  // Default ingredients matching ProductPricing
  const defaultIngredients = [
    { name: "Coffee Beans", unit: "kg" },
    { name: "Milk", unit: "liter" },
    { name: "Sugar", unit: "kg" },
    { name: "Flour", unit: "kg" },
    { name: "Butter", unit: "kg" },
    { name: "Eggs", unit: "piece" },
    { name: "Chocolate", unit: "kg" },
    { name: "Vanilla", unit: "ml" },
    { name: "Cinnamon", unit: "kg" },
    { name: "Honey", unit: "kg" },
    { name: "Tea Leaves", unit: "kg" },
    { name: "Cream", unit: "liter" }
  ];

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from('stock')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      
      // If no stock items exist, create default ingredients
      if (!data || data.length === 0) {
        const defaultStockItems = defaultIngredients.map((ingredient, index) => ({
          id: `default-${index}`,
          name: ingredient.name,
          unit: ingredient.unit,
          current_quantity: 0,
          min_quantity: 5,
          cost_per_unit: 0,
          supplier: "",
          category: "ingredient",
          is_active: true
        }));
        setStockItems(defaultStockItems);
      } else {
        setStockItems(data || []);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching stock",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    if (!newStock.name || newStock.current_quantity < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter valid stock details",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('stock')
        .insert([newStock])
        .select();

      if (error) throw error;

      setStockItems([...stockItems, data[0]]);
      setNewStock({
        name: "",
        unit: "kg",
        current_quantity: 0,
        min_quantity: 0,
        cost_per_unit: 0,
        supplier: "",
        category: "ingredient"
      });
      setIsAddingStock(false);

      toast({
        title: "Stock Added",
        description: `${newStock.name} has been added to inventory`,
      });
    } catch (error: any) {
      toast({
        title: "Error adding stock",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateStockQuantity = async (stockId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('stock')
        .update({ current_quantity: newQuantity })
        .eq('id', stockId);

      if (error) throw error;

      setStockItems(stockItems.map(item => 
        item.id === stockId ? { ...item, current_quantity: newQuantity } : item
      ));

      toast({
        title: "Stock Updated",
        description: "Stock quantity has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error updating stock",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditStock = (item: StockItem) => {
    setEditingStockId(item.id);
    setEditStock({ ...item });
  };

  const handleUpdateStock = async () => {
    if (!editStock || !editStock.name) {
      toast({
        title: "Validation Error",
        description: "Please enter valid stock details",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('stock')
        .update({
          name: editStock.name,
          unit: editStock.unit,
          current_quantity: editStock.current_quantity,
          min_quantity: editStock.min_quantity,
          cost_per_unit: editStock.cost_per_unit,
          supplier: editStock.supplier,
          category: editStock.category
        })
        .eq('id', editStock.id);

      if (error) throw error;

      setStockItems(stockItems.map(item => 
        item.id === editStock.id ? editStock : item
      ));
      setEditingStockId(null);
      setEditStock(null);

      toast({
        title: "Stock Updated",
        description: `${editStock.name} has been updated successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating stock",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteStock = async (stockId: string) => {
    try {
      const { error } = await supabase
        .from('stock')
        .update({ is_active: false })
        .eq('id', stockId);

      if (error) throw error;

      setStockItems(stockItems.filter(item => item.id !== stockId));
      setDeleteConfirmId(null);

      toast({
        title: "Stock Deleted",
        description: "Stock item has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting stock",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Management</CardTitle>
          <CardDescription>Loading stock items...</CardDescription>
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
              <Package className="h-5 w-5 text-primary" />
              Stock Management
            </CardTitle>
            <CardDescription>Manage inventory and ingredients</CardDescription>
          </div>
          <Button onClick={() => setIsAddingStock(true)} variant="professional" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Stock Item
          </Button>
        </CardHeader>
        <CardContent>
          {isAddingStock && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Add New Stock Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stockName">Item Name</Label>
                    <Input
                      id="stockName"
                      value={newStock.name}
                      onChange={(e) => setNewStock(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Coffee Beans"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stockUnit">Unit</Label>
                    <Select
                      value={newStock.unit}
                      onValueChange={(value) => setNewStock(prev => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currentQuantity">Current Quantity</Label>
                    <Input
                      id="currentQuantity"
                      type="number"
                      step="0.01"
                      value={newStock.current_quantity}
                      onChange={(e) => setNewStock(prev => ({ ...prev, current_quantity: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minQuantity">Minimum Quantity</Label>
                    <Input
                      id="minQuantity"
                      type="number"
                      step="0.01"
                      value={newStock.min_quantity}
                      onChange={(e) => setNewStock(prev => ({ ...prev, min_quantity: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="costPerUnit">Cost per Unit (EGP)</Label>
                    <Input
                      id="costPerUnit"
                      type="number"
                      step="0.01"
                      value={newStock.cost_per_unit}
                      onChange={(e) => setNewStock(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier (Optional)</Label>
                    <Input
                      id="supplier"
                      value={newStock.supplier}
                      onChange={(e) => setNewStock(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Supplier name"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddStock} variant="professional">
                    Add Stock Item
                  </Button>
                  <Button onClick={() => setIsAddingStock(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockItems.map((item) => {
              const isEditing = editingStockId === item.id;
              const currentItem = isEditing ? editStock : item;

              return (
                <Card key={item.id} className={`${item.current_quantity <= item.min_quantity ? 'border-destructive/50' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      {isEditing ? (
                        <Input
                          value={currentItem?.name || ''}
                          onChange={(e) => setEditStock(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="h-8 font-semibold"
                        />
                      ) : (
                        <CardTitle className="text-base">{item.name}</CardTitle>
                      )}
                      {!isEditing && item.current_quantity <= item.min_quantity && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {isEditing ? (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs">Unit</Label>
                            <Select
                              value={currentItem?.unit || 'kg'}
                              onValueChange={(value) => setEditStock(prev => prev ? { ...prev, unit: value } : null)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {units.map((unit) => (
                                  <SelectItem key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Current Quantity</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={currentItem?.current_quantity || 0}
                              onChange={(e) => setEditStock(prev => prev ? { ...prev, current_quantity: parseFloat(e.target.value) || 0 } : null)}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Min Quantity</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={currentItem?.min_quantity || 0}
                              onChange={(e) => setEditStock(prev => prev ? { ...prev, min_quantity: parseFloat(e.target.value) || 0 } : null)}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Cost per Unit (EGP)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={currentItem?.cost_per_unit || 0}
                              onChange={(e) => setEditStock(prev => prev ? { ...prev, cost_per_unit: parseFloat(e.target.value) || 0 } : null)}
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Supplier</Label>
                            <Input
                              value={currentItem?.supplier || ''}
                              onChange={(e) => setEditStock(prev => prev ? { ...prev, supplier: e.target.value } : null)}
                              className="h-8"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleUpdateStock} size="sm" className="flex-1">
                              Save
                            </Button>
                            <Button 
                              onClick={() => {
                                setEditingStockId(null);
                                setEditStock(null);
                              }} 
                              size="sm" 
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Current:</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.current_quantity}
                              onChange={(e) => updateStockQuantity(item.id, parseFloat(e.target.value) || 0)}
                              className="w-20 h-8"
                            />
                            <span className="text-sm">{item.unit}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Min:</span>
                            <span className="text-sm">{item.min_quantity} {item.unit}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Cost:</span>
                            <span className="text-sm">EGP {item.cost_per_unit}/{item.unit}</span>
                          </div>
                          {item.supplier && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Supplier:</span>
                              <span className="text-sm">{item.supplier}</span>
                            </div>
                          )}
                          <Badge 
                            variant={item.current_quantity <= item.min_quantity ? "destructive" : "default"}
                            className="w-full justify-center"
                          >
                            {item.current_quantity <= item.min_quantity ? "Low Stock" : "In Stock"}
                          </Badge>
                          <div className="flex gap-2 pt-2">
                            <Button 
                              onClick={() => handleEditStock(item)} 
                              size="sm" 
                              variant="outline"
                              className="flex-1 gap-1"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button 
                              onClick={() => setDeleteConfirmId(item.id)} 
                              size="sm" 
                              variant="outline"
                              className="flex-1 gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {stockItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No stock items found. Add your first stock item to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stock Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this stock item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteStock(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StockManagement;