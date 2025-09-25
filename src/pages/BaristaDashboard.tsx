import { useState } from "react";
import { ArrowLeft, Coffee, Clock, CheckCircle, MapPin, Plus } from "lucide-react";
import SpotinHeader from "@/components/SpotinHeader";
import ClientSelector from "@/components/ClientSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  client_code: string;
  full_name: string;
  phone: string;
  email?: string;
  active: boolean;
}

interface Order {
  id: string;
  item: string;
  location: string;
  customerName: string;
  clientId?: string;
  status: "pending" | "preparing" | "ready" | "completed";
  orderTime: string;
  notes?: string;
}

const BaristaDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-001",
      item: "Cappuccino",
      location: "Desk A12",
      customerName: "Sarah Johnson",
      status: "pending",
      orderTime: "14:23",
      notes: "Extra foam"
    },
    {
      id: "ORD-002",
      item: "Americano",
      location: "Meeting Room 2",
      customerName: "Mike Chen",
      status: "preparing",
      orderTime: "14:21"
    },
    {
      id: "ORD-003",
      item: "Latte",
      location: "Desk B7",
      customerName: "Emma Wilson",
      status: "ready",
      orderTime: "14:18"
    }
  ]);

  const quickItems = [
    { name: "Espresso", time: "2 min", icon: Coffee },
    { name: "Americano", time: "3 min", icon: Coffee },
    { name: "Cappuccino", time: "4 min", icon: Coffee },
    { name: "Latte", time: "4 min", icon: Coffee },
    { name: "Macchiato", time: "3 min", icon: Coffee },
    { name: "Mocha", time: "5 min", icon: Coffee }
  ];

  const addQuickItem = (itemName: string) => {
    if (!selectedClient) {
      toast({
        title: "No Client Selected",
        description: "Please select an active client before adding items.",
        variant: "destructive",
      });
      return;
    }

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      item: itemName,
      location: "Station Pickup",
      customerName: selectedClient.full_name,
      clientId: selectedClient.id,
      status: "pending",
      orderTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: `Quick add by barista for ${selectedClient.client_code}`
    };

    setOrders(prev => [...prev, newOrder]);
    setIsQuickAddOpen(false);
    
    toast({
      title: "Item Added",
      description: `${itemName} added for ${selectedClient.full_name}`,
    });
  };

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "preparing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready": return "bg-green-100 text-green-800 border-green-200";
      case "completed": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending": return Clock;
      case "preparing": return Coffee;
      case "ready": return CheckCircle;
      case "completed": return CheckCircle;
      default: return Clock;
    }
  };

  const pendingOrders = orders.filter(order => order.status === "pending");
  const preparingOrders = orders.filter(order => order.status === "preparing");
  const readyOrders = orders.filter(order => order.status === "ready");

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Barista Station</h1>
            <p className="text-muted-foreground">Manage drink orders and queue efficiently</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="pb-3">
              <CardDescription>Pending Orders</CardDescription>
              <CardTitle className="text-2xl text-primary">{pendingOrders.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-card border-accent/20">
            <CardHeader className="pb-3">
              <CardDescription>In Preparation</CardDescription>
              <CardTitle className="text-2xl text-accent">{preparingOrders.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-card border-success/20">
            <CardHeader className="pb-3">
              <CardDescription>Ready for Pickup</CardDescription>
              <CardTitle className="text-2xl text-success">{readyOrders.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gradient-card">
            <CardHeader className="pb-3">
              <CardDescription>Avg. Prep Time</CardDescription>
              <CardTitle className="text-2xl">4 min</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Queue */}
          <div className="lg:col-span-2">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-primary" />
                  Order Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
                    <TabsTrigger value="preparing">Preparing ({preparingOrders.length})</TabsTrigger>
                    <TabsTrigger value="ready">Ready ({readyOrders.length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pending" className="space-y-4 mt-6">
                    {pendingOrders.map((order) => {
                      const StatusIcon = getStatusIcon(order.status);
                      return (
                        <div key={order.id} className="p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <StatusIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <h4 className="font-semibold">{order.item}</h4>
                                <p className="text-sm text-muted-foreground">{order.customerName}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {order.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {order.orderTime}
                            </div>
                          </div>
                          {order.notes && (
                            <p className="text-sm bg-muted p-2 rounded mb-3">
                              <strong>Note:</strong> {order.notes}
                            </p>
                          )}
                          <Button 
                            onClick={() => updateOrderStatus(order.id, "preparing")}
                            className="w-full"
                            variant="professional"
                          >
                            Start Preparing
                          </Button>
                        </div>
                      );
                    })}
                  </TabsContent>
                  
                  <TabsContent value="preparing" className="space-y-4 mt-6">
                    {preparingOrders.map((order) => {
                      const StatusIcon = getStatusIcon(order.status);
                      return (
                        <div key={order.id} className="p-4 border rounded-lg bg-card border-primary/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <StatusIcon className="h-4 w-4 text-primary animate-pulse" />
                              <div>
                                <h4 className="font-semibold">{order.item}</h4>
                                <p className="text-sm text-muted-foreground">{order.customerName}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {order.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {order.orderTime}
                            </div>
                          </div>
                          {order.notes && (
                            <p className="text-sm bg-muted p-2 rounded mb-3">
                              <strong>Note:</strong> {order.notes}
                            </p>
                          )}
                          <Button 
                            onClick={() => updateOrderStatus(order.id, "ready")}
                            className="w-full"
                            variant="accent"
                          >
                            Mark as Ready
                          </Button>
                        </div>
                      );
                    })}
                  </TabsContent>
                  
                  <TabsContent value="ready" className="space-y-4 mt-6">
                    {readyOrders.map((order) => {
                      const StatusIcon = getStatusIcon(order.status);
                      return (
                        <div key={order.id} className="p-4 border rounded-lg bg-card border-success/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <StatusIcon className="h-4 w-4 text-success" />
                              <div>
                                <h4 className="font-semibold">{order.item}</h4>
                                <p className="text-sm text-muted-foreground">{order.customerName}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {order.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {order.orderTime}
                            </div>
                          </div>
                          {order.notes && (
                            <p className="text-sm bg-muted p-2 rounded mb-3">
                              <strong>Note:</strong> {order.notes}
                            </p>
                          )}
                          <Button 
                            onClick={() => updateOrderStatus(order.id, "completed")}
                            className="w-full"
                            variant="card"
                          >
                            Mark as Delivered
                          </Button>
                        </div>
                      );
                    })}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Client Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-accent" />
                  Quick Add Items
                </CardTitle>
                <CardDescription>Select client and add items quickly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ClientSelector 
                  onClientSelect={setSelectedClient}
                  selectedClientId={selectedClient?.id}
                />
                
                <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="professional" 
                      className="w-full"
                      disabled={!selectedClient}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Quick Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Quick Add Item</DialogTitle>
                      <DialogDescription>
                        {selectedClient 
                          ? `Adding item for ${selectedClient.full_name} (${selectedClient.client_code})`
                          : "Please select a client first"
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {quickItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.name}
                            variant="outline"
                            className="h-20 flex-col gap-2"
                            onClick={() => addQuickItem(item.name)}
                          >
                            <Icon className="h-6 w-6" />
                            <div className="text-center">
                              <div className="font-medium text-sm">{item.name}</div>
                              <div className="text-xs text-muted-foreground">~{item.time}</div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>

                {selectedClient && (
                  <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                    <strong>Selected:</strong> {selectedClient.full_name}
                    <br />
                    <strong>Code:</strong> {selectedClient.client_code}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaristaDashboard;