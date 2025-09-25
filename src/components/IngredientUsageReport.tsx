import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StockWithUsage {
  id: string;
  name: string;
  current_quantity: number;
  min_quantity: number;
  unit: string;
  cost_per_unit: number;
  products_using: Array<{
    product_name: string;
    quantity_needed: number;
    category: string;
  }>;
  total_usage_potential: number;
  stock_level_percentage: number;
}

const IngredientUsageReport = () => {
  const [stockWithUsage, setStockWithUsage] = useState<StockWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStockUsageData();
  }, []);

  const fetchStockUsageData = async () => {
    try {
      setLoading(true);
      
      // Fetch stock items with their product usage
      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select(`
          id,
          name,
          current_quantity,
          min_quantity,
          unit,
          cost_per_unit,
          product_ingredients(
            quantity_needed,
            drinks(
              name,
              category
            )
          )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (stockError) throw stockError;

      const processedData: StockWithUsage[] = stockData?.map(stock => {
        const productsUsing = stock.product_ingredients?.map((pi: any) => ({
          product_name: pi.drinks?.name || 'Unknown Product',
          quantity_needed: pi.quantity_needed,
          category: pi.drinks?.category || 'unknown'
        })) || [];

        const totalUsagePotential = productsUsing.reduce((sum, product) => sum + product.quantity_needed, 0);
        const stockLevelPercentage = stock.min_quantity > 0 
          ? Math.min((stock.current_quantity / stock.min_quantity) * 100, 100)
          : stock.current_quantity > 0 ? 100 : 0;

        return {
          ...stock,
          products_using: productsUsing,
          total_usage_potential: totalUsagePotential,
          stock_level_percentage: stockLevelPercentage
        };
      }) || [];

      setStockWithUsage(processedData);
    } catch (error: any) {
      toast({
        title: "Error fetching usage data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = stockWithUsage.filter(item => item.current_quantity <= item.min_quantity);
  const criticalStockItems = stockWithUsage.filter(item => item.current_quantity === 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ingredient Usage Report</CardTitle>
          <CardDescription>Loading usage data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Alerts */}
      {criticalStockItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Stock Alert:</strong> {criticalStockItems.length} ingredient(s) are completely out of stock: {criticalStockItems.map(item => item.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}
      
      {lowStockItems.length > 0 && criticalStockItems.length === 0 && (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            <strong>Low Stock Warning:</strong> {lowStockItems.length} ingredient(s) are running low: {lowStockItems.map(item => item.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Ingredient Usage & Stock Analysis
          </CardTitle>
          <CardDescription>
            Track ingredient usage across products and stock levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stockWithUsage.map((stock) => (
              <Card key={stock.id} className={`relative ${stock.current_quantity <= stock.min_quantity ? 'border-destructive/50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{stock.name}</CardTitle>
                    {stock.current_quantity <= stock.min_quantity && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stock Level</span>
                      <span className="font-medium">
                        {stock.current_quantity} / {stock.min_quantity} {stock.unit}
                      </span>
                    </div>
                    <Progress 
                      value={stock.stock_level_percentage} 
                      className="h-2"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Used in Products ({stock.products_using.length})
                    </h4>
                    {stock.products_using.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {stock.products_using.map((usage, index) => (
                          <div key={index} className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded">
                            <div>
                              <div className="font-medium">{usage.product_name}</div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {usage.category}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{usage.quantity_needed} {stock.unit}</div>
                              <div className="text-muted-foreground">per item</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                        Not used in any products
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cost per unit:</span>
                      <span className="font-medium">{formatPrice(stock.cost_per_unit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total value:</span>
                      <span className="font-medium">{formatPrice(stock.current_quantity * stock.cost_per_unit)}</span>
                    </div>
                    {stock.total_usage_potential > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Max products:</span>
                        <span className="font-medium flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {Math.floor(stock.current_quantity / stock.total_usage_potential * stock.products_using.length)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Badge 
                    variant={stock.current_quantity <= stock.min_quantity ? "destructive" : "default"}
                    className="w-full justify-center"
                  >
                    {stock.current_quantity === 0 ? "Out of Stock" : 
                     stock.current_quantity <= stock.min_quantity ? "Low Stock" : "In Stock"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {stockWithUsage.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No stock items found. Add stock items to see usage reports.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IngredientUsageReport;