import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Package, DollarSign, ShoppingCart, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductSale {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
  avg_price: number;
}

interface TopProductsSalesProps {
  variant?: 'default' | 'compact';
}

const TopProductsSales = ({ variant = 'default' }: TopProductsSalesProps) => {
  const [products, setProducts] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchTopProducts();
  }, [timeRange]);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const { data, error } = await supabase.rpc('get_top_products_by_sales', {
        p_start_date: startDate.toISOString(),
        p_end_date: new Date().toISOString(),
        p_limit: 10
      });

      if (error) throw error;
      setProducts((data as any) || []);
    } catch (error) {
      console.error('Error fetching top products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const maxRevenue = products.length > 0 ? Math.max(...products.map(p => p.total_revenue)) : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Top Products</CardTitle>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No sales data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.slice(0, 5).map((product, index) => (
                <div key={product.product_name} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.total_quantity} sold • {formatCurrency(product.total_revenue)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {product.order_count} orders
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Top 10 Products by Sales</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Best selling products ranked by revenue
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last 7 days
                </div>
              </SelectItem>
              <SelectItem value="30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last 30 days
                </div>
              </SelectItem>
              <SelectItem value="90">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last 90 days
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Sales Data</h3>
            <p className="text-muted-foreground">
              No completed orders found in the selected time period
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product, index) => (
              <div
                key={product.product_name}
                className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-4 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{product.product_name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            {product.order_count} orders
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Avg: {formatCurrency(product.avg_price)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(product.total_revenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Revenue Progress</span>
                        <span className="font-medium">
                          {((product.total_revenue / maxRevenue) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={(product.total_revenue / maxRevenue) * 100} 
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Package className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Quantity Sold</p>
                          <p className="font-semibold">{product.total_quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Avg per Order</p>
                          <p className="font-semibold">
                            {(product.total_quantity / product.order_count).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
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

export default TopProductsSales;