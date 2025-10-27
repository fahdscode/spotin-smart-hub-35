import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Save, X, Trash2, Folder } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  products_count?: number;
}

const ProductCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    icon: "",
    color: "bg-purple-100 text-purple-800"
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const colorOptions = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800", 
    "bg-yellow-100 text-yellow-800",
    "bg-pink-100 text-pink-800",
    "bg-purple-100 text-purple-800",
    "bg-indigo-100 text-indigo-800",
    "bg-red-100 text-red-800",
    "bg-orange-100 text-orange-800"
  ];

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Validation Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: newCategory.name,
          description: newCategory.description || null,
          icon: newCategory.icon || "📁",
          color: newCategory.color,
          products_count: 0
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      setNewCategory({ name: "", description: "", icon: "", color: "bg-purple-100 text-purple-800" });
      setIsAddingCategory(false);

      toast({
        title: "Category Added",
        description: `${newCategory.name} category has been created successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error adding category",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async (categoryId: string, updates: Partial<Category>) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(categories.map(cat => 
        cat.id === categoryId ? { ...cat, ...updates } : cat
      ));
      setEditingCategory(null);

      toast({
        title: "Category Updated",
        description: "Category has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating category",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    
    if (category && category.products_count && category.products_count > 0) {
      toast({
        title: "Cannot Delete",
        description: `Cannot delete ${category.name} - it contains ${category.products_count} products`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(categories.filter(cat => cat.id !== categoryId));
      
      toast({
        title: "Category Deleted",
        description: `${category?.name} category has been deleted`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              Product Categories
            </CardTitle>
            <CardDescription>Manage product categories and organization</CardDescription>
          </div>
          <Button 
            onClick={() => setIsAddingCategory(true)}
            variant="professional"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {/* Add New Category Form */}
          {isAddingCategory && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Add New Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Beverages"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryIcon">Icon (emoji)</Label>
                    <Input
                      id="categoryIcon"
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                      placeholder="☕"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="categoryDescription">Description</Label>
                  <Input
                    id="categoryDescription"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Category description..."
                  />
                </div>
                <div>
                  <Label>Color Theme</Label>
                  <div className="flex gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 ${color} ${
                          newCategory.color === color ? 'border-foreground' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddCategory} variant="professional">
                    <Save className="h-4 w-4 mr-2" />
                    Save Category
                  </Button>
                  <Button onClick={() => setIsAddingCategory(false)} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="relative group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        {editingCategory === category.id ? (
                          <Input
                            value={category.name}
                            onChange={(e) => {
                              setCategories(categories.map(cat => 
                                cat.id === category.id ? { ...cat, name: e.target.value } : cat
                              ));
                            }}
                            className="h-6 text-sm"
                          />
                        ) : (
                          <CardTitle className="text-base">{category.name}</CardTitle>
                        )}
                        {category.description && (
                          <CardDescription className="text-xs">{category.description}</CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge className={category.color}>
                      {category.products_count} products
                    </Badge>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingCategory === category.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateCategory(category.id, {})}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCategory(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCategory(category.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={category.products_count && category.products_count > 0}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No categories found. Add your first category to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductCategories;