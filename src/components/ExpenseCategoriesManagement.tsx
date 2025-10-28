import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit3, Trash2, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
}

const COLORS = [
  { value: 'bg-blue-500', label: 'Blue' },
  { value: 'bg-green-500', label: 'Green' },
  { value: 'bg-red-500', label: 'Red' },
  { value: 'bg-yellow-500', label: 'Yellow' },
  { value: 'bg-purple-500', label: 'Purple' },
  { value: 'bg-pink-500', label: 'Pink' },
  { value: 'bg-indigo-500', label: 'Indigo' },
  { value: 'bg-orange-500', label: 'Orange' },
  { value: 'bg-cyan-500', label: 'Cyan' },
  { value: 'bg-gray-500', label: 'Gray' },
];

export const ExpenseCategoriesManagement = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error Loading Categories",
        description: "Failed to load expense categories. Please try refreshing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      color: 'bg-blue-500',
    });
    setEditingCategory(null);
    setIsAddingCategory(false);
  };

  const handleSubmitCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('expense_categories')
          .update({
            name: categoryForm.name,
            description: categoryForm.description || null,
            color: categoryForm.color,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: "Category Updated",
          description: `${categoryForm.name} has been updated successfully`,
        });
      } else {
        const { error } = await supabase
          .from('expense_categories')
          .insert({
            name: categoryForm.name,
            description: categoryForm.description || null,
            color: categoryForm.color,
            is_active: true,
          });

        if (error) throw error;

        toast({
          title: "Category Created",
          description: `${categoryForm.name} has been created successfully`,
        });
      }

      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Failed to save category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category: ExpenseCategory) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color,
    });
    setEditingCategory(category);
    setIsAddingCategory(true);
  };

  const handleToggleActive = async (category: ExpenseCategory) => {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: category.is_active ? "Category Deactivated" : "Category Activated",
        description: `${category.name} has been ${category.is_active ? 'deactivated' : 'activated'}`,
      });

      fetchCategories();
    } catch (error) {
      console.error('Error toggling category:', error);
      toast({
        title: "Error",
        description: "Failed to update category status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (category: ExpenseCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: "Category Deleted",
        description: `${category.name} has been deleted successfully`,
      });

      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category. It may be in use.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Expense Categories
            </CardTitle>
            <CardDescription>Manage expense categories for financial tracking</CardDescription>
          </div>
          <Dialog open={isAddingCategory} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsAddingCategory(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Update category details' : 'Create a new expense category'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g., Office Supplies"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Brief description of this category"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Select
                    value={categoryForm.color}
                    onValueChange={(value) => setCategoryForm({ ...categoryForm, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${color.value}`} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitCategory}>
                    {editingCategory ? 'Update' : 'Create'} Category
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No expense categories found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.description || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${category.color}`} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(category)}
                      >
                        {category.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
