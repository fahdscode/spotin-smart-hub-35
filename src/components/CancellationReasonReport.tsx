import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Ban, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CancellationStats {
  totalCancelled: number;
  byCategory: { category: string; count: number; percentage: number }[];
  recentCancellations: {
    id: string;
    item_name: string;
    cancellation_reason: string;
    cancelled_at: string;
    cancelled_by_name: string;
  }[];
}

const COLORS = ['hsl(var(--destructive))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function CancellationReasonReport() {
  const [stats, setStats] = useState<CancellationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // Last 30 days

  useEffect(() => {
    fetchCancellationStats();
  }, [dateRange]);

  const fetchCancellationStats = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      // Fetch cancelled orders with staff info
      const { data: cancelledOrders, error } = await supabase
        .from('session_line_items')
        .select(`
          id,
          item_name,
          cancellation_reason,
          cancelled_at,
          cancelled_by,
          admin_users!session_line_items_cancelled_by_fkey (
            full_name
          )
        `)
        .eq('status', 'cancelled')
        .gte('cancelled_at', startDate.toISOString())
        .order('cancelled_at', { ascending: false });

      if (error) throw error;

      // Process statistics
      const categoryMap = new Map<string, number>();
      
      cancelledOrders?.forEach((order) => {
        if (order.cancellation_reason) {
          // Extract category from reason (format: "Category: Details")
          const category = order.cancellation_reason.split(':')[0] || 'Other';
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        } else {
          categoryMap.set('No Reason Specified', (categoryMap.get('No Reason Specified') || 0) + 1);
        }
      });

      const total = cancelledOrders?.length || 0;
      const byCategory = Array.from(categoryMap.entries())
        .map(([category, count]) => ({
          category,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const recentCancellations = cancelledOrders?.slice(0, 10).map((order: any) => ({
        id: order.id,
        item_name: order.item_name,
        cancellation_reason: order.cancellation_reason || 'No reason provided',
        cancelled_at: order.cancelled_at,
        cancelled_by_name: order.admin_users?.full_name || 'Unknown',
      })) || [];

      setStats({
        totalCancelled: total,
        byCategory,
        recentCancellations,
      });
    } catch (error) {
      console.error('Error fetching cancellation stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Order Cancellations Analysis
              </CardTitle>
              <CardDescription>
                Breakdown of cancelled orders in the last {dateRange} days
              </CardDescription>
            </div>
            <Badge variant="destructive" className="text-lg px-4 py-2">
              <TrendingDown className="h-4 w-4 mr-2" />
              {stats.totalCancelled} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <h3 className="text-sm font-medium mb-4">Cancellation Reasons Distribution</h3>
              {stats.byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.byCategory}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.percentage.toFixed(1)}%`}
                    >
                      {stats.byCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No cancellation data available
                </div>
              )}
            </div>

            {/* Bar Chart */}
            <div>
              <h3 className="text-sm font-medium mb-4">Cancellation Count by Reason</h3>
              {stats.byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No cancellation data available
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Cancellations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Cancellations</CardTitle>
          <CardDescription>Latest cancelled orders with reasons</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Cancelled By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentCancellations.length > 0 ? (
                stats.recentCancellations.map((cancellation) => (
                  <TableRow key={cancellation.id}>
                    <TableCell className="font-medium">{cancellation.item_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cancellation.cancellation_reason}
                    </TableCell>
                    <TableCell>{cancellation.cancelled_by_name}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(cancellation.cancelled_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No recent cancellations
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
