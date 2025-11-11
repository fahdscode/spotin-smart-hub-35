import { useState, useEffect } from "react";
import { ArrowLeft, Coffee, Clock, CheckCircle, MapPin, Plus, Edit, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import SpotinHeader from "@/components/SpotinHeader";
import ClientSelector from "@/components/ClientSelector";
import ClientProductEditor from "@/components/ClientProductEditor";
import QuickItemSelector from "@/components/QuickItemSelector";
import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CancellationReasonDialog } from "@/components/CancellationReasonDialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import OrderingCycleStatus from "@/components/OrderingCycleStatus";
import { 
  playNewOrder, 
  playStartPreparing, 
  playOrderReady, 
  playOrderCompleted, 
  playOrderCancelled,
  playError,
  playMultipleOrders
} from "@/lib/baristaSounds";
interface Client {
  id: string;
  client_code: string;
  full_name: string;
  phone: string;
  email?: string;
  active: boolean;
  barcode?: string;
  ticketInfo?: {
    has_active_ticket: boolean;
    ticket_name?: string;
    includes_free_drink?: boolean;
    max_free_drink_price?: number;
    free_drink_claimed?: boolean;
    expiry_date?: string;
  };
}
interface Order {
  id: string;
  item_name: string;
  user_id: string;
  quantity: number;
  price: number;
  status: "pending" | "preparing" | "ready" | "completed" | "served" | "cancelled";
  created_at: string;
  customerName?: string;
  table_number?: string;
  notes?: string;
}
const BaristaDashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isEditProductsOpen, setIsEditProductsOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickTableNumber, setQuickTableNumber] = useState<string>('');
  const [loadingTicketInfo, setLoadingTicketInfo] = useState(false);

  // Track previous order count to detect new orders
  const [previousOrderCount, setPreviousOrderCount] = useState(0);

  const fetchClientTicketInfo = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_client_ticket_info', { p_client_id: clientId });
      
      if (error) throw error;
      return data as any;
    } catch (error) {
      console.error('Error fetching ticket info:', error);
      return { has_active_ticket: false };
    }
  };

  const handleClientSelect = async (client: Client | null) => {
    if (!client) {
      setSelectedClient(null);
      return;
    }
    
    setLoadingTicketInfo(true);
    const ticketInfo = await fetchClientTicketInfo(client.id);
    setSelectedClient({
      ...client,
      ticketInfo
    });
    setLoadingTicketInfo(false);
  };
  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription for new orders
    const channel = supabase.channel('barista-orders').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'session_line_items'
    }, payload => {
      console.log('Real-time order update:', payload);

      // Refresh orders when any change occurs
      fetchOrders();

      // Play sound for new orders
      if (payload.eventType === 'INSERT' && payload.new?.status === 'pending') {
        console.log('New order received, playing sound');
        playNewOrder();
      } else if (payload.eventType === 'UPDATE' && payload.new?.status === 'ready') {
        playOrderReady();
      } else if (payload.eventType === 'UPDATE' && payload.new?.status === 'cancelled') {
        playOrderCancelled();
      }
    }).subscribe(status => {
      console.log('Real-time subscription status:', status);
    });
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);
  const fetchOrders = async () => {
    try {
      setLoading(true);
      // First get orders - exclude cancelled orders from active view
      const {
        data: ordersData,
        error
      } = await supabase.from('session_line_items').select('*').not('status', 'eq', 'cancelled').in('status', ['pending', 'preparing', 'ready', 'completed']).order('created_at', {
        ascending: true
      });
      if (error) throw error;

      // Then get client names for each order
      const clientIds = [...new Set(ordersData?.map(order => order.user_id) || [])];
      const {
        data: clientsData
      } = await supabase.from('clients').select('id, full_name, client_code').in('id', clientIds);
      const clientsMap = new Map(clientsData?.map(client => [client.id, client]) || []);
      const formattedOrders: Order[] = ordersData?.map(order => {
        const client = clientsMap.get(order.user_id);
        return {
          id: order.id,
          item_name: order.item_name,
          user_id: order.user_id,
          quantity: order.quantity,
          price: order.price,
          status: order.status as any,
          created_at: order.created_at,
          customerName: client?.full_name || 'Unknown Client',
          table_number: order.table_number,
          notes: order.notes
        };
      }) || [];
      
      // Check for multiple new orders
      const pendingCount = formattedOrders.filter(o => o.status === 'pending').length;
      if (pendingCount > previousOrderCount && pendingCount >= 3) {
        playMultipleOrders();
      }
      setPreviousOrderCount(pendingCount);
      
      setOrders(formattedOrders);
    } catch (error: any) {
      toast({
        title: "Error fetching orders",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const quickItems = [{
    name: "Espresso",
    time: "2 min",
    icon: Coffee
  }, {
    name: "Americano",
    time: "3 min",
    icon: Coffee
  }, {
    name: "Cappuccino",
    time: "4 min",
    icon: Coffee
  }, {
    name: "Latte",
    time: "4 min",
    icon: Coffee
  }, {
    name: "Macchiato",
    time: "3 min",
    icon: Coffee
  }, {
    name: "Mocha",
    time: "5 min",
    icon: Coffee
  }];
  const addQuickItem = async (itemName: string, note?: string) => {
    if (!selectedClient) {
      toast({
        title: "No Client Selected",
        description: "Please select an active client before adding items.",
        variant: "destructive"
      });
      return;
    }
    try {
      // Get the drink price from the database
      const {
        data: drinkData,
        error: drinkError
      } = await supabase.from('drinks').select('price').eq('name', itemName).single();
      if (drinkError) throw drinkError;
      
      // Check if this qualifies as a free drink
      const isFreeDrink = 
        selectedClient.ticketInfo?.includes_free_drink &&
        !selectedClient.ticketInfo?.free_drink_claimed &&
        drinkData.price <= (selectedClient.ticketInfo?.max_free_drink_price || 0);
      
      const finalPrice = isFreeDrink ? 0 : drinkData.price;
      const orderNote = isFreeDrink 
        ? `Free drink from ticket: ${selectedClient.ticketInfo?.ticket_name}${note ? ' | ' + note : ''}`
        : note?.trim() || null;
      
      const {
        error
      } = await supabase.from('session_line_items').insert({
        user_id: selectedClient.id,
        item_name: itemName,
        quantity: 1,
        price: finalPrice,
        status: 'pending',
        table_number: quickTableNumber.trim() || null,
        notes: orderNote
      });
      if (error) throw error;
      
      // If it was a free drink, update the ticket
      if (isFreeDrink && selectedClient.ticketInfo) {
        const { error: ticketError } = await supabase
          .from('client_tickets')
          .update({
            free_drink_claimed: true,
            free_drink_claimed_at: new Date().toISOString(),
            claimed_drink_name: itemName
          })
          .eq('client_id', selectedClient.id)
          .eq('is_active', true);
        
        if (ticketError) console.error('Error updating ticket:', ticketError);
        
        // Refresh client ticket info
        const updatedTicketInfo = await fetchClientTicketInfo(selectedClient.id);
        setSelectedClient({
          ...selectedClient,
          ticketInfo: updatedTicketInfo
        });
      }
      
      setIsQuickAddOpen(false);

      // Play notification sound for new order
      playNewOrder();
      toast({
        title: isFreeDrink ? "Free Drink Added! 🎉" : "Item Added",
        description: isFreeDrink 
          ? `Free ${itemName} added for ${selectedClient.full_name}`
          : `${itemName} added for ${selectedClient.full_name}`
      });

      // Refresh orders list
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error Adding Item",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const {
        error
      } = await supabase.from('session_line_items').update({
        status: newStatus
      }).eq('id', orderId);
      if (error) throw error;
      
      // Play appropriate sound based on status
      switch (newStatus) {
        case 'preparing':
          playStartPreparing();
          break;
        case 'ready':
          playOrderReady();
          break;
        case 'completed':
        case 'served':
          playOrderCompleted();
          break;
      }
      
      toast({
        title: "Order Updated",
        description: `Order status updated to ${newStatus}`
      });

      // Refresh orders list
      fetchOrders();
    } catch (error: any) {
      playError();
      toast({
        title: "Error Updating Order",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  const handleCancelOrderClick = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancellationDialogOpen(true);
  };

  const cancelOrder = async (reason: string, category: string) => {
    if (!orderToCancel) return;
    
    try {
      // Get order details first to send notification
      const orderDetails = orders.find(o => o.id === orderToCancel);
      
      // Get current user for cancelled_by field
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update order with cancellation details
      const { error: updateError } = await supabase
        .from('session_line_items')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: user?.id,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderToCancel);

      if (updateError) throw updateError;
      
      // Send email notification to client if order details are available
      if (orderDetails) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('email, full_name')
          .eq('id', orderDetails.user_id)
          .single();

        if (clientData?.email) {
          // Send cancellation email
          await supabase.functions.invoke('send-emails', {
            body: {
              to: clientData.email,
              subject: 'Order Cancelled - SpotIN',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #dc2626;">Order Cancelled</h2>
                  <p>Dear ${clientData.full_name || 'Customer'},</p>
                  <p>We regret to inform you that your order has been cancelled:</p>
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Item:</strong> ${orderDetails.item_name}</p>
                    <p style="margin: 5px 0;"><strong>Quantity:</strong> ${orderDetails.quantity}</p>
                    ${orderDetails.table_number ? `<p style="margin: 5px 0;"><strong>Table:</strong> ${orderDetails.table_number}</p>` : ''}
                    <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>
                  </div>
                  <p>If you have any questions, please don't hesitate to contact our staff.</p>
                  <p style="margin-top: 30px;">Best regards,<br><strong>SpotIN Team</strong></p>
                </div>
              `
            }
          });
        }
      }
      
      // Play cancellation sound
      playOrderCancelled();
      
      toast({
        title: "Order Cancelled",
        description: "Order cancelled and client notified"
      });

      // Refresh orders list
      fetchOrders();
      setOrderToCancel(null);
    } catch (error: any) {
      playError();
      toast({
        title: "Error Cancelling Order",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "served":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return Clock;
      case "preparing":
        return Coffee;
      case "ready":
        return CheckCircle;
      case "completed":
        return CheckCircle;
      default:
        return Clock;
    }
  };
  const pendingOrders = orders.filter(order => order.status === "pending");
  const preparingOrders = orders.filter(order => order.status === "preparing");
  const readyOrders = orders.filter(order => order.status === "ready");
  const completedOrders = orders.filter(order => order.status === "completed");
  return <div className="min-h-screen bg-background">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Barista Station</h1>
              <p className="text-muted-foreground">Manage drink orders and queue efficiently</p>
            </div>
          </div>
          <LogoutButton />
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
                    {pendingOrders.map(order => {
                    const StatusIcon = getStatusIcon(order.status);
                    return <div key={order.id} className="p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <StatusIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <h4 className="font-semibold">{order.item_name} x{order.quantity}</h4>
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
                              Table {order.table_number || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                            </div>
                          </div>
                          {order.notes && <p className="text-sm bg-muted p-2 rounded mb-3">
                              <strong>Note:</strong> {order.notes}
                            </p>}
                          <div className="flex gap-2">
                            <Button 
                              className="flex-1" 
                              variant="professional"
                              onClick={() => updateOrderStatus(order.id, "preparing")}
                            >
                              Start Preparing
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleCancelOrderClick(order.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>;
                  })}
                  </TabsContent>
                  
                  <TabsContent value="preparing" className="space-y-4 mt-6">
                    {preparingOrders.map(order => {
                    const StatusIcon = getStatusIcon(order.status);
                    return <div key={order.id} className="p-4 border rounded-lg bg-card border-primary/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <StatusIcon className="h-4 w-4 text-primary animate-pulse" />
                              <div>
                                <h4 className="font-semibold">{order.item_name} x{order.quantity}</h4>
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
                              Table {order.table_number || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                            </div>
                          </div>
                          {order.notes && <p className="text-sm bg-muted p-2 rounded mb-3">
                              <strong>Note:</strong> {order.notes}
                            </p>}
                          <div className="flex gap-2">
                            <Button 
                              className="flex-1" 
                              variant="accent"
                              onClick={() => updateOrderStatus(order.id, "ready")}
                            >
                              Mark as Ready
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleCancelOrderClick(order.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>;
                  })}
                  </TabsContent>
                  
                  <TabsContent value="ready" className="space-y-4 mt-6">
                    {readyOrders.map(order => {
                    const StatusIcon = getStatusIcon(order.status);
                    return <div key={order.id} className="p-4 border rounded-lg bg-card border-success/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <StatusIcon className="h-4 w-4 text-success" />
                              <div>
                                <h4 className="font-semibold">{order.item_name} x{order.quantity}</h4>
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
                              Table {order.table_number || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                            </div>
                          </div>
                          {order.notes && <p className="text-sm bg-muted p-2 rounded mb-3">
                              <strong>Note:</strong> {order.notes}
                            </p>}
                          <Button onClick={() => updateOrderStatus(order.id, "completed")} className="w-full" variant="card">
                            Mark as Delivered
                          </Button>
                        </div>;
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
                <ClientSelector onClientSelect={handleClientSelect} selectedClientId={selectedClient?.id} />
                
                {selectedClient?.ticketInfo?.has_active_ticket && 
                 selectedClient?.ticketInfo?.includes_free_drink && 
                 !selectedClient?.ticketInfo?.free_drink_claimed && (
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-500/50 border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-500 p-2 rounded-full">
                          <Coffee className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-green-500 hover:bg-green-600">
                              FREE DRINK AVAILABLE
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {selectedClient.ticketInfo.ticket_name}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                            Maximum Price: {selectedClient.ticketInfo.max_free_drink_price?.toFixed(2)} EGP
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Client can select any drink up to this price at no charge
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {selectedClient?.ticketInfo?.has_active_ticket && 
                 selectedClient?.ticketInfo?.includes_free_drink && 
                 selectedClient?.ticketInfo?.free_drink_claimed && (
                  <Card className="bg-muted/50 border-muted">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Free drink already claimed on this ticket
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {selectedClient && (
                  <div className="space-y-2">
                    <Label htmlFor="quickTableNumber" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Table Number (optional)
                    </Label>
                    <Input
                      id="quickTableNumber"
                      type="text"
                      placeholder="Enter table number"
                      value={quickTableNumber}
                      onChange={(e) => setQuickTableNumber(e.target.value)}
                      className="text-center"
                    />
                  </div>
                )}

                <Button variant="default" className="w-full" disabled={!selectedClient} onClick={() => setIsQuickAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Quick Item
                </Button>

                {selectedClient && <div className="space-y-3">
                    <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                      <strong>Selected:</strong> {selectedClient.full_name}
                      <br />
                      <strong>Code:</strong> {selectedClient.client_code}
                      <br />
                      <strong>Barcode:</strong> {selectedClient.barcode}
                    </div>
                    
                  </div>}
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
          maxFreeDrinkPrice={selectedClient?.ticketInfo?.max_free_drink_price}
          hasFreeDrink={
            selectedClient?.ticketInfo?.includes_free_drink && 
            !selectedClient?.ticketInfo?.free_drink_claimed
          }
        />

        {/* Client Product Editor Dialog */}
        <ClientProductEditor 
          isOpen={isEditProductsOpen} 
          onClose={() => setIsEditProductsOpen(false)} 
          selectedClient={selectedClient}
          maxFreeDrinkPrice={selectedClient?.ticketInfo?.max_free_drink_price}
          hasFreeDrink={
            selectedClient?.ticketInfo?.includes_free_drink && 
            !selectedClient?.ticketInfo?.free_drink_claimed
          }
        />

        {/* Cancellation Reason Dialog */}
        <CancellationReasonDialog
          open={cancellationDialogOpen}
          onOpenChange={setCancellationDialogOpen}
          onConfirm={cancelOrder}
          itemName={orderToCancel ? orders.find(o => o.id === orderToCancel)?.item_name : undefined}
        />
      </div>
    </div>;
};
export default BaristaDashboard;