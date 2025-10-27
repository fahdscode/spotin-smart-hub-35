import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Percent, DollarSign, Package, Gift, Plus, Edit, Trash2, Calendar, Tag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  promotion_type: 'percentage' | 'fixed_amount' | 'combo' | 'buy_x_get_y' | 'category_discount';
  discount_value: number;
  applicable_to: 'all' | 'specific_products' | 'specific_category' | 'combo';
  product_ids: string[];
  category: string | null;
  combo_items: any;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  usage_limit: number | null;
  times_used: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    promotion_type: "percentage" as Promotion['promotion_type'],
    discount_value: 0,
    applicable_to: "all" as Promotion['applicable_to'],
    product_ids: [] as string[],
    category: "",
    min_purchase_amount: 0,
    max_discount_amount: null as number | null,
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    is_active: true,
    usage_limit: null as number | null,
  });

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions((data as any) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('drinks')
        .select('id, name, price, category')
        .eq('is_available', true)
        .neq('category', 'day_use_ticket');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name');

      if (error) throw error;
      setCategories(data?.map(c => c.name) || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const promotionData = {
        ...formData,
        end_date: formData.end_date || null,
        max_discount_amount: formData.max_discount_amount || null,
        usage_limit: formData.usage_limit || null,
      };

      if (editingPromotion) {
        const { error } = await supabase
          .from('promotions')
          .update(promotionData)
          .eq('id', editingPromotion.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Promotion updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert([promotionData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Promotion created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPromotions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Promotion deleted successfully",
      });

      fetchPromotions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (promotion: Promotion) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: !promotion.is_active })
        .eq('id', promotion.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Promotion ${!promotion.is_active ? 'activated' : 'deactivated'}`,
      });

      fetchPromotions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      promotion_type: "percentage",
      discount_value: 0,
      applicable_to: "all",
      product_ids: [],
      category: "",
      min_purchase_amount: 0,
      max_discount_amount: null,
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      is_active: true,
      usage_limit: null,
    });
    setEditingPromotion(null);
  };

  const handleEdit = (promotion: Promotion) => {
    setFormData({
      name: promotion.name,
      description: promotion.description || "",
      promotion_type: promotion.promotion_type,
      discount_value: promotion.discount_value,
      applicable_to: promotion.applicable_to,
      product_ids: promotion.product_ids || [],
      category: promotion.category || "",
      min_purchase_amount: promotion.min_purchase_amount,
      max_discount_amount: promotion.max_discount_amount,
      start_date: promotion.start_date.split('T')[0],
      end_date: promotion.end_date ? promotion.end_date.split('T')[0] : "",
      is_active: promotion.is_active,
      usage_limit: promotion.usage_limit,
    });
    setEditingPromotion(promotion);
    setIsDialogOpen(true);
  };

  const getPromotionIcon = (type: Promotion['promotion_type']) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-4 w-4" />;
      case 'fixed_amount':
        return <DollarSign className="h-4 w-4" />;
      case 'combo':
        return <Package className="h-4 w-4" />;
      case 'buy_x_get_y':
        return <Gift className="h-4 w-4" />;
      case 'category_discount':
        return <Tag className="h-4 w-4" />;
      default:
        return <Percent className="h-4 w-4" />;
    }
  };

  const getPromotionTypeLabel = (type: Promotion['promotion_type']) => {
    const labels = {
      percentage: 'Percentage Discount',
      fixed_amount: 'Fixed Amount',
      combo: 'Combo Deal',
      buy_x_get_y: 'Buy X Get Y',
      category_discount: 'Category Discount'
    };
    return labels[type];
  };

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Sales & Promotions
            </CardTitle>
            <CardDescription>
              Manage discounts, combos, and promotional offers
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
                </DialogTitle>
                <DialogDescription>
                  Set up discounts, combos, and special offers
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Label htmlFor="name">Promotion Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Summer Sale 20% Off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the promotion..."
                    rows={2}
                  />
                </div>

                {/* Promotion Type */}
                <div className="space-y-2">
                  <Label htmlFor="promotion_type">Promotion Type</Label>
                  <select
                    id="promotion_type"
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.promotion_type}
                    onChange={(e) => setFormData({ ...formData, promotion_type: e.target.value as any })}
                  >
                    <option value="percentage">Percentage Discount</option>
                    <option value="fixed_amount">Fixed Amount Discount</option>
                    <option value="combo">Combo Deal</option>
                    <option value="buy_x_get_y">Buy X Get Y Free</option>
                    <option value="category_discount">Category Discount</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    {formData.promotion_type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (EGP)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                {/* Applicable To */}
                <div className="space-y-2">
                  <Label htmlFor="applicable_to">Apply To</Label>
                  <select
                    id="applicable_to"
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.applicable_to}
                    onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value as any })}
                  >
                    <option value="all">All Products</option>
                    <option value="specific_products">Specific Products</option>
                    <option value="specific_category">Specific Category</option>
                  </select>
                </div>

                {/* Specific Products */}
                {formData.applicable_to === 'specific_products' && (
                  <div className="space-y-2">
                    <Label>Select Products</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                      {products.map((product) => (
                        <label key={product.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.product_ids.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  product_ids: [...formData.product_ids, product.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  product_ids: formData.product_ids.filter(id => id !== product.id)
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{product.name} ({formatCurrency(product.price)})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Selection */}
                {formData.applicable_to === 'specific_category' && (
                  <div className="space-y-2">
                    <Label htmlFor="category">Select Category</Label>
                    <select
                      id="category"
                      className="w-full p-2 border rounded-md bg-background"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Advanced Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_purchase">Min Purchase Amount (EGP)</Label>
                    <Input
                      id="min_purchase"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.min_purchase_amount}
                      onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  {formData.promotion_type === 'percentage' && (
                    <div className="space-y-2">
                      <Label htmlFor="max_discount">Max Discount Cap (EGP)</Label>
                      <Input
                        id="max_discount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.max_discount_amount || ''}
                        onChange={(e) => setFormData({ ...formData, max_discount_amount: parseFloat(e.target.value) || null })}
                        placeholder="Optional"
                      />
                    </div>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date (Optional)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Usage Limit */}
                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Usage Limit (Optional)</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    min="0"
                    value={formData.usage_limit || ''}
                    onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || null })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                    <p className="text-xs text-muted-foreground">Enable this promotion immediately</p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleSubmit} className="flex-1">
                    {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                  </Button>
                  <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {promotions.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Promotions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first promotion to boost sales and engage customers
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {promotions.map((promotion) => (
              <div
                key={promotion.id}
                className={`p-4 border rounded-lg ${
                  !promotion.is_active || isExpired(promotion.end_date)
                    ? 'bg-muted/50 opacity-70'
                    : 'bg-background'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getPromotionIcon(promotion.promotion_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{promotion.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getPromotionTypeLabel(promotion.promotion_type)}
                        </p>
                      </div>
                    </div>

                    {promotion.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {promotion.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary">
                        {promotion.promotion_type === 'percentage'
                          ? `${promotion.discount_value}% Off`
                          : `${formatCurrency(promotion.discount_value)} Off`
                        }
                      </Badge>

                      {promotion.min_purchase_amount > 0 && (
                        <Badge variant="outline">
                          Min: {formatCurrency(promotion.min_purchase_amount)}
                        </Badge>
                      )}

                      {promotion.max_discount_amount && (
                        <Badge variant="outline">
                          Max: {formatCurrency(promotion.max_discount_amount)}
                        </Badge>
                      )}

                      {promotion.usage_limit && (
                        <Badge variant="outline">
                          Used: {promotion.times_used}/{promotion.usage_limit}
                        </Badge>
                      )}

                      {isExpired(promotion.end_date) && (
                        <Badge variant="destructive">Expired</Badge>
                      )}

                      {!promotion.is_active && !isExpired(promotion.end_date) && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}

                      {promotion.is_active && !isExpired(promotion.end_date) && (
                        <Badge className="bg-green-500">Active</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(promotion.start_date).toLocaleDateString()}
                          {promotion.end_date && ` - ${new Date(promotion.end_date).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Switch
                      checked={promotion.is_active}
                      onCheckedChange={() => handleToggleActive(promotion)}
                    />
                    <Button
                      onClick={() => handleEdit(promotion)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(promotion.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromotionsManagement;