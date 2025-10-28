import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, Calendar, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [showAllProducts, setShowAllProducts] = useState(false);

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
  
  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#84cc16', '#f97316', '#14b8a6'];
  
  const chartData = products.slice(0, 5).map((product, index) => ({
    name: product.product_name.length > 15 ? product.product_name.substring(0, 15) + '...' : product.product_name,
    fullName: product.product_name,
    revenue: product.total_revenue,
    quantity: product.total_quantity,
    color: COLORS[index % COLORS.length]
  }));

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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Top Products by Sales</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Top 5 best selling products by revenue
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
            <div className="space-y-6">
              {/* Chart */}
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.fullName;
                        }
                        return label;
                      }}
                    />
                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top 5 Summary */}
              <div className="space-y-2">
                {products.slice(0, 5).map((product, index) => (
                  <div
                    key={product.product_name}
                    className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.total_quantity} sold • {product.order_count} orders
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(product.total_revenue)}</p>
                      <p className="text-xs text-muted-foreground">Avg: {formatCurrency(product.avg_price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* See More Button */}
              {products.length > 5 && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowAllProducts(true)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  See All {products.length} Products
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Products Dialog */}
      <Dialog open={showAllProducts} onOpenChange={setShowAllProducts}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Products Sales Report</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Quantity Sold</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={product.product_name}>
                    <TableCell>
                      <div 
                        className="flex items-center justify-center w-7 h-7 rounded-full text-white font-bold text-xs"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell className="text-right">{product.total_quantity}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{product.order_count}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(product.avg_price)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(product.total_revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopProductsSales;