import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Clock, CheckCircle, XCircle } from 'lucide-react';

interface OrderHistoryItem {
  id: string;
  item_name: string;
  quantity: number;
  price: number;
  status: string;
  created_at: string;
}

interface ClientOrderHistoryProps {
  clientId: string;
}

export const ClientOrderHistory = ({ clientId }: ClientOrderHistoryProps) => {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrderHistory();
  }, [clientId]);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('session_line_items')
        .select('*')
        .eq('user_id', clientId)
        .in('status', ['completed', 'served', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast({
        title: "Error",
        description: "Failed to load order history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'served':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      completed: "default",
      served: "secondary",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const groupOrdersByDate = (orders: OrderHistoryItem[]) => {
    const grouped: { [date: string]: OrderHistoryItem[] } = {};
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(order);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No order history yet</p>
        </CardContent>
      </Card>
    );
  }

  const groupedOrders = groupOrdersByDate(orders);

  return (
    <div className="space-y-4">
      {Object.entries(groupedOrders).map(([date, dateOrders]) => (
        <Card key={date}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              {date}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dateOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-medium">{order.item_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {order.quantity}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(order.price * order.quantity)}</p>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            ))}
            <div className="pt-2 border-t">
              <p className="text-right font-semibold">
                Total: {formatCurrency(dateOrders.reduce((sum, o) => sum + (o.price * o.quantity), 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
