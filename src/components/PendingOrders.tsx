import { useState } from "react";
import { Clock, Package, CheckCircle, XCircle, Eye, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MetricCard from "@/components/MetricCard";
import { toast } from "sonner";

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  orderDate: string;
  expectedDelivery: string;
  status: "pending" | "processing" | "ready" | "delivered" | "cancelled";
  priority: "low" | "medium" | "high";
  notes?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

const PendingOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const orders: Order[] = [
    {
      id: "ORD-001",
      customerName: "John Smith",
      customerEmail: "john.smith@email.com",
      items: [
        { name: "Coffee Package - Premium", quantity: 2, price: 25.00 },
        { name: "Meeting Room (2hrs)", quantity: 1, price: 40.00 }
      ],
      totalAmount: 90.00,
      orderDate: "2024-01-15",
      expectedDelivery: "2024-01-17",
      status: "pending",
      priority: "high",
      notes: "Customer requested morning delivery"
    },
    {
      id: "ORD-002",
      customerName: "Sarah Johnson",
      customerEmail: "sarah.j@company.com",
      items: [
        { name: "Event Ticket - Tech Talk", quantity: 3, price: 25.00 },
        { name: "Catering Package", quantity: 1, price: 120.00 }
      ],
      totalAmount: 195.00,
      orderDate: "2024-01-14",
      expectedDelivery: "2024-01-16",
      status: "processing",
      priority: "medium"
    },
    {
      id: "ORD-003",
      customerName: "Mike Wilson",
      customerEmail: "m.wilson@tech.io",
      items: [
        { name: "Workspace Rental - Day Pass", quantity: 5, price: 35.00 }
      ],
      totalAmount: 175.00,
      orderDate: "2024-01-13",
      expectedDelivery: "2024-01-15",
      status: "ready",
      priority: "low"
    },
    {
      id: "ORD-004",
      customerName: "Emily Davis",
      customerEmail: "emily.davis@startup.com",
      items: [
        { name: "Conference Room - Half Day", quantity: 1, price: 80.00 },
        { name: "AV Equipment", quantity: 1, price: 30.00 }
      ],
      totalAmount: 110.00,
      orderDate: "2024-01-16",
      expectedDelivery: "2024-01-18",
      status: "pending",
      priority: "medium",
      notes: "Setup required by 9 AM"
    }
  ];

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready": return "bg-green-100 text-green-800 border-green-200";
      case "delivered": return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: Order["priority"]) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    // TODO: Implement order status update API call
    toast("Order status would be updated to: " + newStatus);
  };

  const totalOrders = orders.length;
  const pendingCount = orders.filter(order => order.status === "pending").length;
  const processingCount = orders.filter(order => order.status === "processing").length;
  const readyCount = orders.filter(order => order.status === "ready").length;
  const totalValue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

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
          title="Processing"
          value={processingCount.toString()}
          icon={Package}
          variant="info"
        />
        <MetricCard
          title="Ready"
          value={readyCount.toString()}
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
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
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
                      {order.expectedDelivery}
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
                              <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
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
                                    <div><strong>Email:</strong> {selectedOrder.customerEmail}</div>
                                    <div><strong>Order Date:</strong> {selectedOrder.orderDate}</div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Order Items</h4>
                                  <div className="space-y-2">
                                    {selectedOrder.items.map((item, index) => (
                                      <div key={index} className="flex justify-between text-sm">
                                        <span>{item.name} (x{item.quantity})</span>
                                        <span>€{(item.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                    ))}
                                    <div className="border-t pt-2 font-medium flex justify-between">
                                      <span>Total:</span>
                                      <span>€{selectedOrder.totalAmount.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                {selectedOrder.notes && (
                                  <div>
                                    <h4 className="font-medium mb-2">Notes</h4>
                                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  {selectedOrder.status === "pending" && (
                                    <Button
                                      size="sm"
                                      variant="professional"
                                      onClick={() => updateOrderStatus(selectedOrder.id, "processing")}
                                    >
                                      Start Processing
                                    </Button>
                                  )}
                                  {selectedOrder.status === "processing" && (
                                    <Button
                                      size="sm"
                                      variant="professional"
                                      onClick={() => updateOrderStatus(selectedOrder.id, "ready")}
                                    >
                                      Mark Ready
                                    </Button>
                                  )}
                                  {selectedOrder.status === "ready" && (
                                    <Button
                                      size="sm"
                                      variant="professional"
                                      onClick={() => updateOrderStatus(selectedOrder.id, "delivered")}
                                    >
                                      Mark Delivered
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
                            onClick={() => updateOrderStatus(order.id, "processing")}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingOrders;