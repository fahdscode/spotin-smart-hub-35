import { useState, useEffect } from "react";
import { Clock, Package, CheckCircle, XCircle, Eye, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import MetricCard from "@/components/MetricCard";
import { supabase } from "@/integrations/supabase/client";
import { useOrderProcessing } from "@/hooks/useOrderProcessing";
import { toast } from "sonner";

interface Order {
  id: string;
  user_id: string;
  item_name: string;
  quantity: number;
  price: number;
  status: "pending" | "preparing" | "completed" | "served";
  created_at: string;
  client?: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
  };
}

interface GroupedOrder {
  user_id: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; price: number; total: number }[];
  totalAmount: number;
  orderDate: string;
  status: "pending" | "preparing" | "completed" | "served";
  priority: "low" | "medium" | "high";
}

const PendingOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<GroupedOrder | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { updateOrderStatus } = useOrderProcessing();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('session_line_items')
        .select('*')
        .in('status', ['pending', 'preparing', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Fetch client details separately for each order
      const ordersWithClients = await Promise.all((data || []).map(async (item: any) => {
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, full_name, phone, email')
          .eq('id', item.user_id)
          .single();

        return {
          ...item,
          status: item.status as Order['status'],
          client: clientData || { id: item.user_id, full_name: 'Unknown', phone: '', email: '' }
        };
      }));
      
      setOrders(ordersWithClients);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Group orders by user_id to create grouped orders
  const groupedOrders: GroupedOrder[] = orders.reduce((acc, order) => {
    const existingGroup = acc.find(group => group.user_id === order.user_id);
    
    if (existingGroup) {
      existingGroup.items.push({
        name: order.item_name,
        quantity: order.quantity,
        price: order.price,
        total: order.price * order.quantity
      });
      existingGroup.totalAmount += order.price * order.quantity;
    } else {
      acc.push({
        user_id: order.user_id,
        customerName: order.client?.full_name || "Unknown Customer",
        customerEmail: order.client?.email || order.client?.phone || "",
        items: [{
          name: order.item_name,
          quantity: order.quantity,
          price: order.price,
          total: order.price * order.quantity
        }],
        totalAmount: order.price * order.quantity,
        orderDate: new Date(order.created_at).toLocaleDateString(),
        status: order.status,
        priority: order.price > 100 ? "high" : order.price > 50 ? "medium" : "low"
      });
    }
    
    return acc;
  }, [] as GroupedOrder[]);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "preparing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "served": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: GroupedOrder["priority"]) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredOrders = groupedOrders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateOrderStatus = async (userId: string, newStatus: Order["status"]) => {
    try {
      // Update all order items for this user
      const userOrders = orders.filter(order => order.user_id === userId);
      
      for (const order of userOrders) {
        await updateOrderStatus(order.id, newStatus);
      }
      
      // Refresh orders after update
      await fetchOrders();
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error("Failed to update order status");
    }
  };

  const totalOrders = groupedOrders.length;
  const pendingCount = groupedOrders.filter(order => order.status === "pending").length;
  const preparingCount = groupedOrders.filter(order => order.status === "preparing").length;
  const completedCount = groupedOrders.filter(order => order.status === "completed").length;
  const totalValue = groupedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Order Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Orders"
          value={totalOrders.toString()}
          icon={Package}
          variant="default"
        />
        <MetricCard
          title="Pending"
          value={pendingCount.toString()}
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="Preparing"
          value={preparingCount.toString()}
          icon={Package}
          variant="info"
        />
        <MetricCard
          title="Completed"
          value={completedCount.toString()}
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Orders Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Orders Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="served">Served</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <div className="border rounded-lg">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[150px]" />
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[80px]" />
                    <Skeleton className="h-10 w-[100px]" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.user_id}>
                      <TableCell className="font-medium font-mono text-xs">
                        {order.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.items.length} item(s)
                          <div className="text-xs text-muted-foreground">
                            {order.items[0].name}
                            {order.items.length > 1 && ` +${order.items.length - 1} more`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        €{order.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.orderDate}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Order Details</DialogTitle>
                                <DialogDescription>
                                  Complete order information and status updates
                                </DialogDescription>
                              </DialogHeader>
                              {selectedOrder && (
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Customer Information</h4>
                                    <div className="text-sm space-y-1">
                                      <div><strong>Name:</strong> {selectedOrder.customerName}</div>
                                      <div><strong>Contact:</strong> {selectedOrder.customerEmail}</div>
                                      <div><strong>Order Date:</strong> {selectedOrder.orderDate}</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium mb-2">Order Items</h4>
                                    <div className="space-y-2">
                                      {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                          <span>{item.name} (x{item.quantity})</span>
                                          <span>€{item.total.toFixed(2)}</span>
                                        </div>
                                      ))}
                                      <div className="border-t pt-2 font-medium flex justify-between">
                                        <span>Total:</span>
                                        <span>€{selectedOrder.totalAmount.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    {selectedOrder.status === "pending" && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleUpdateOrderStatus(selectedOrder.user_id, "preparing")}
                                      >
                                        Start Preparing
                                      </Button>
                                    )}
                                    {selectedOrder.status === "preparing" && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleUpdateOrderStatus(selectedOrder.user_id, "completed")}
                                      >
                                        Mark Completed
                                      </Button>
                                    )}
                                    {selectedOrder.status === "completed" && (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleUpdateOrderStatus(selectedOrder.user_id, "served")}
                                      >
                                        Mark Served
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {order.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.user_id, "preparing")}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          
          {!loading && filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? "No orders found matching your criteria" 
                  : "No orders available"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingOrders;