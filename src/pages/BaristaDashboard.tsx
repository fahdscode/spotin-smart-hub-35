import { useState } from "react";
import { ArrowLeft, Coffee, Clock, CheckCircle, MapPin, Plus, Edit, XCircle } from "lucide-react";
import SpotinHeader from "@/components/SpotinHeader";
import ClientSelector from "@/components/ClientSelector";
import ClientProductEditor from "@/components/ClientProductEditor";
import QuickItemSelector from "@/components/QuickItemSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  client_code: string;
  full_name: string;
  phone: string;
  email?: string;
  active: boolean;
  barcode?: string;
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
  const [isEditProductsOpen, setIsEditProductsOpen] = useState(false);
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

  const addQuickItem = (itemName: string, note?: string) => {
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
      notes: note || `Quick add by barista for ${selectedClient.client_code}`
    };

    setOrders(prev => [...prev, newOrder]);
    setIsQuickAddOpen(false);
    
    // Play notification sound for new order
    playOrderNotification();
    
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

  const cancelOrder = (orderId: string) => {
    setOrders(orders.filter(order => order.id !== orderId));
    toast({
      title: "Order Cancelled",
      description: "Order has been cancelled successfully",
    });
  };

  const playOrderNotification = () => {
    // Create audio context for notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
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
                          <div className="flex gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  className="flex-1"
                                  variant="professional"
                                >
                                  Start Preparing
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Start Preparing Order</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to start preparing {order.item} for {order.customerName}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => updateOrderStatus(order.id, "preparing")}>
                                    Start Preparing
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive"
                                  size="sm"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel the order for {order.item}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Order</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => cancelOrder(order.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Cancel Order
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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
                          <div className="flex gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  className="flex-1"
                                  variant="accent"
                                >
                                  Mark as Ready
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Mark Order as Ready</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Confirm that {order.item} for {order.customerName} is ready for pickup?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Not Ready</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => updateOrderStatus(order.id, "ready")}>
                                    Mark as Ready
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive"
                                  size="sm"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel the order for {order.item}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep Order</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => cancelOrder(order.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Cancel Order
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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
                
                <Button 
                  variant="professional" 
                  className="w-full"
                  disabled={!selectedClient}
                  onClick={() => setIsQuickAddOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quick Item
                </Button>

                {selectedClient && (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                      <strong>Selected:</strong> {selectedClient.full_name}
                      <br />
                      <strong>Code:</strong> {selectedClient.client_code}
                      <br />
                      <strong>Barcode:</strong> {selectedClient.barcode}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={!selectedClient}
                      onClick={() => setIsEditProductsOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Client Products
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Item Selector Dialog */}
        <QuickItemSelector
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          selectedClient={selectedClient}
          onItemSelect={addQuickItem}
        />

        {/* Client Product Editor Dialog */}
        <ClientProductEditor
          isOpen={isEditProductsOpen}
          onClose={() => setIsEditProductsOpen(false)}
          selectedClient={selectedClient}
        />
      </div>
    </div>
  );
};

export default BaristaDashboard;