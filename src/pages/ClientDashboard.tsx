import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import SpotinHeader from '@/components/SpotinHeader';
import BarcodeCard from '@/components/BarcodeCard';
import ClientEvents from '@/components/ClientEvents';
import SatisfactionPopup from '@/components/SatisfactionPopup';
import { LogoutButton } from '@/components/LogoutButton';
import { ClientOrderHistory } from '@/components/ClientOrderHistory';
import { PaymentDialog } from '@/components/PaymentDialog';
import { usePaymentProcessing } from '@/hooks/usePaymentProcessing';
import { Coffee, Clock, Star, Plus, Minus, Search, RotateCcw, ShoppingCart, Heart, User, Receipt, QrCode, Calendar, BarChart3, MapPin, Sparkles, TrendingUp, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';
import confetti from 'canvas-confetti';

// Remove this interface as we'll use the one from AuthContext

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Drink {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  is_available: boolean;
}

interface LastOrder {
  order_date: string;
  items: Array<{
    item_name: string;
    quantity: number;
    price: number;
  }>;
  total_items: number;
  total_price: number;
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clientData, isAuthenticated, userRole, clearClientAuth } = useAuth();
  
  // Core state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'order' | 'profile' | 'events'>('home');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const { processPayment } = usePaymentProcessing();
  
  // Order data
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [lastOrders, setLastOrders] = useState<LastOrder[]>([]);
  const [favoriteDrinks, setFavoriteDrinks] = useState<Drink[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Profile data
  const [checkInsLast30Days, setCheckInsLast30Days] = useState<number>(0);
  const [membershipStatus, setMembershipStatus] = useState<string>('No active membership');
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  
  // Analytics data
  const [lastVisitDate, setLastVisitDate] = useState<string | null>(null);
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [favoriteTimeSlot, setFavoriteTimeSlot] = useState<string>('Morning');
  
  // Satisfaction popup
  const [showSatisfactionPopup, setShowSatisfactionPopup] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated || userRole !== 'client') {
      setLoading(false);
      navigate('/client-login');
      return;
    }
    
    if (clientData?.id) {
      fetchAllData(clientData.id);
      fetchCheckInStatus(clientData.id);
      setLoading(false);

      // Set up real-time subscription for client status updates
      const clientChannel = supabase
        .channel('client-status-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'clients',
            filter: `id=eq.${clientData.id}`
          },
          (payload) => {
            console.log('🔄 Real-time client status update:', payload);
            fetchCheckInStatus(clientData.id);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'check_ins',
            filter: `client_id=eq.${clientData.id}`
          },
          (payload) => {
            console.log('🔄 Real-time check-in update:', payload);
            fetchCheckInStatus(clientData.id);
          }
        )
        .subscribe();

      // Set up real-time subscription for order updates
      const ordersChannel = supabase
        .channel('client-orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'session_line_items',
            filter: `user_id=eq.${clientData.id}`
          },
          (payload) => {
            console.log('🔄 Real-time order update:', payload);
            fetchPendingOrders();
          }
        )
        .subscribe();

      // Cleanup subscriptions on unmount
      return () => {
        supabase.removeChannel(clientChannel);
        supabase.removeChannel(ordersChannel);
      };
    }
  }, [isAuthenticated, userRole, clientData, navigate]);

  const fetchAllData = async (clientId: string) => {
    try {
      // Fetch drinks
      const { data: drinksData } = await supabase
        .from('drinks')
        .select('*')
        .eq('is_available', true)
        .order('category');
      
      if (drinksData) {
        setDrinks(drinksData);
        loadMockFavorites(drinksData);
      }

      // Fetch last orders
      const { data: lastOrdersData } = await supabase
        .rpc('get_client_last_orders', { p_user_id: clientId, p_limit: 3 });
      
      if (lastOrdersData && Array.isArray(lastOrdersData)) {
        setLastOrders(lastOrdersData as unknown as LastOrder[]);
      }

      // Fetch pending orders
      await fetchPendingOrders(clientId);

      // Fetch check-ins and analytics
      fetchCheckInsLast30Days(clientId);
      fetchMembershipStatus(clientId);
      fetchCheckInStatus(clientId);
      fetchClientAnalytics(clientId);
      loadMockTransactions();
      
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchPendingOrders = async (clientId?: string) => {
    if (!clientId && !clientData?.id) return;
    
    const userId = clientId || clientData?.id;
    
    try {
      const { data, error } = await supabase
        .from('session_line_items')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending orders:', error);
        return;
      }

      setPendingOrders(data || []);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  const loadMockFavorites = (availableDrinks: Drink[]) => {
    const mockFavorites = availableDrinks
      .filter(drink => ['Cappuccino', 'Latte', 'Americano'].includes(drink.name))
      .slice(0, 3);
    setFavoriteDrinks(mockFavorites);
  };

  const fetchCheckInsLast30Days = async (clientId: string) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data } = await supabase
        .from('check_in_logs')
        .select('*')
        .eq('client_id', clientId)
        .eq('action', 'checked_in')
        .gte('timestamp', thirtyDaysAgo.toISOString());
      
      setCheckInsLast30Days(data?.length || 12);
    } catch (error) {
      setCheckInsLast30Days(12);
    }
  };

  const fetchMembershipStatus = async (clientId: string) => {
    try {
      const { data } = await supabase
        .from('client_memberships')
        .select('plan_name, is_active')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle();
      
      setMembershipStatus(data?.plan_name || 'Premium Member');
    } catch (error) {
      setMembershipStatus('Premium Member');
    }
  };

  const fetchCheckInStatus = async (clientId: string) => {
    try {
      // First check the client's active status (most reliable)
      const { data: clientStatus, error: clientError } = await supabase
        .from('clients')
        .select('active, updated_at')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error('Error fetching client status:', clientError);
        setIsCheckedIn(false);
        setCheckInTime(null);
        return;
      }

      console.log('📊 Client status from database:', clientStatus);

      if (clientStatus?.active) {
        setIsCheckedIn(true);
        // Get the latest check-in time
        const { data: checkInData } = await supabase
          .from('check_ins')
          .select('checked_in_at')
          .eq('client_id', clientId)
          .eq('status', 'checked_in')
          .is('checked_out_at', null)
          .order('checked_in_at', { ascending: false })
          .limit(1);
        
        const checkInTime = checkInData?.[0]?.checked_in_at || clientStatus.updated_at;
        setCheckInTime(new Date(checkInTime).toLocaleTimeString());
        console.log('✅ Client is checked in, time:', checkInTime);
      } else {
        setIsCheckedIn(false);
        setCheckInTime(null);
        console.log('❌ Client is checked out');
      }
    } catch (error) {
      console.error('Error fetching check-in status:', error);
      setIsCheckedIn(false);
      setCheckInTime(null);
    }
  };

  const fetchClientAnalytics = async (clientId: string) => {
    try {
      // Fetch last visit (last check-out)
      const { data: lastCheckOut } = await supabase
        .from('check_in_logs')
        .select('timestamp')
        .eq('client_id', clientId)
        .eq('action', 'checked_out')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastCheckOut) {
        setLastVisitDate(new Date(lastCheckOut.timestamp).toLocaleDateString());
      }

      // Fetch total visits count
      const { data: allCheckIns } = await supabase
        .from('check_in_logs')
        .select('timestamp')
        .eq('client_id', clientId)
        .eq('action', 'checked_in');
      
      setTotalVisits(allCheckIns?.length || 0);

      // Analyze favorite time slot based on check-ins
      if (allCheckIns && allCheckIns.length > 0) {
        const timeSlots = { Morning: 0, Afternoon: 0, Evening: 0 };
        allCheckIns.forEach(checkIn => {
          const hour = new Date(checkIn.timestamp).getHours();
          if (hour < 12) timeSlots.Morning++;
          else if (hour < 18) timeSlots.Afternoon++;
          else timeSlots.Evening++;
        });
        
        const favoriteSlot = Object.entries(timeSlots).reduce((a, b) => 
          timeSlots[a[0]] > timeSlots[b[0]] ? a : b
        )[0];
        setFavoriteTimeSlot(favoriteSlot);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const loadMockTransactions = () => {
    const mockTransactions = [
      {
        id: '1',
        date: '2024-09-23',
        amount: 15.50,
        items: ['Cappuccino', 'Croissant'],
        status: 'Completed',
        payment_method: 'Card'
      },
      {
        id: '2', 
        date: '2024-09-20',
        amount: 8.75,
        items: ['Latte', 'Cookie'],
        status: 'Completed',
        payment_method: 'Cash'
      }
    ];
    setRecentTransactions(mockTransactions);
  };

  const handleCheckIn = async () => {
    if (!clientData?.barcode) {
      toast({
        title: "Error",
        description: "No barcode found. Please contact reception.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('checkin-checkout', {
        body: {
          barcode: clientData.barcode,
          scanned_by_user_id: clientData.id
        }
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        setIsCheckedIn(true);
        setCheckInTime(new Date().toLocaleTimeString());
        toast({
          title: "Checked In Successfully",
          description: "You can now place orders!",
        });
      } else {
        toast({
          title: "Check-in Failed",
          description: result?.error || "Unable to check in. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Check-in Error",
        description: "Failed to check in. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCheckOut = async () => {
    if (!clientData?.id) {
      toast({
        title: "Error",
        description: "Client information not found.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('checkin-checkout', {
        body: {
          action: 'checkout',
          client_id: clientData.id,
          scanned_by_user_id: clientData.id
        }
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        setIsCheckedIn(false);
        setCheckInTime(null);
        setShowSatisfactionPopup(true);
        toast({
          title: "Checked Out Successfully",
          description: "Thank you for your visit!",
        });
      } else {
        toast({
          title: "Check-out Failed",
          description: result?.error || "Unable to check out. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Check-out error:', error);
      toast({
        title: "Check-out Error",
        description: "Failed to check out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1']
    });
  }, []);

  const addToCart = (drink: Drink, goToCart = false) => {
    if (!isCheckedIn) {
      toast({
        title: "Check-in Required",
        description: "Please check in at reception before placing orders.",
        variant: "destructive"
      });
      return;
    }

    const existingItem = cart.find(item => item.id === drink.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === drink.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: drink.id,
        name: drink.name,
        price: drink.price,
        quantity: 1
      }]);
    }
    
    toast({
      title: "✨ Added to cart",
      description: `${drink.name} added to your order`
    });

    if (goToCart) {
      setCurrentView('order');
    }
  };

  const reorderLastOrder = (order: LastOrder) => {
    if (!isCheckedIn) {
      toast({
        title: "Check-in Required",
        description: "Please check in at reception before placing orders.",
        variant: "destructive"
      });
      return;
    }

    const newCartItems: CartItem[] = [];
    
    order.items.forEach(item => {
      const drink = drinks.find(d => d.name === item.item_name && d.is_available);
      if (drink) {
        newCartItems.push({
          id: drink.id,
          name: drink.name,
          price: drink.price,
          quantity: item.quantity
        });
      }
    });
    
    setCart(newCartItems);
    setCurrentView('order');
    
    toast({
      title: "Order Added!",
      description: `${newCartItems.length} items from your last order added to cart`,
    });
  };

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (!isCheckedIn) {
      toast({
        title: "Check-in Required",
        description: "Please check in at reception before placing orders.",
        variant: "destructive"
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order.",
        variant: "destructive"
      });
      return;
    }

    if (!clientData?.id) {
      toast({
        title: "Authentication Error",
        description: "Client information not found. Please try logging in again.",
        variant: "destructive"
      });
      return;
    }

    const total = getCartTotal();
    setOrderTotal(total);
    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = async (paymentMethod: 'cash' | 'card' | 'mobile') => {
    if (!clientData?.id) return;

    try {
      const validatedItems = cart.filter(item => {
        if (!item.name || item.quantity <= 0 || item.price <= 0) {
          console.warn('Invalid cart item:', item);
          return false;
        }
        return true;
      });

      if (validatedItems.length === 0) {
        throw new Error('No valid items in cart');
      }

      const orderPromises = validatedItems.map(item =>
        supabase.from('session_line_items').insert({
          user_id: clientData.id,
          item_name: item.name,
          quantity: item.quantity,
          price: item.price,
          status: 'pending'
        })
      );

      const results = await Promise.all(orderPromises);
      
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Order placement errors:', errors);
        throw new Error(`Failed to place ${errors.length} order items. ${errors[0].error?.message || ''}`);
      }

      const paymentItems = validatedItems.map(item => ({
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }));

      await processPayment({
        userId: clientData.id,
        items: paymentItems,
        subtotal: orderTotal,
        discount: 0,
        total: orderTotal,
        paymentMethod,
        transactionType: 'order'
      });

      setCart([]);
      setCurrentView('home');
      
      // Trigger confetti celebration
      triggerConfetti();
      
      toast({
        title: "🎉 Order Placed & Paid!",
        description: `Your order has been paid and sent to the barista.`,
      });

      // Refresh pending orders
      await fetchPendingOrders();
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { data: orderToCancel } = await supabase
        .from('session_line_items')
        .select('*')
        .eq('id', orderId)
        .eq('status', 'pending')
        .single();

      if (!orderToCancel) {
        toast({
          title: "Cannot Cancel",
          description: "Order cannot be cancelled at this time",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('session_line_items')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled",
      });

      await fetchPendingOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  const filteredDrinks = drinks.filter(drink =>
    drink.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drink.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    // Logout is handled by the LogoutButton component
    navigate('/client-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center space-y-4">
          <div className="animate-bounce">
            <Coffee className="h-16 w-16 mx-auto text-primary animate-pulse-glow" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader />
      
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          <Button
            variant={currentView === 'home' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('home')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Coffee className="h-4 w-4" />
            <span className="text-xs">Home</span>
          </Button>
          <Button
            variant={currentView === 'order' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => isCheckedIn ? setCurrentView('order') : null}
            className="flex flex-col items-center gap-1 h-auto py-2 relative"
            disabled={!isCheckedIn}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="text-xs">Order</span>
            {cart.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {cart.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={currentView === 'events' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('events')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Events</span>
          </Button>
          <Button
            variant={currentView === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('profile')}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <User className="h-4 w-4" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex justify-center py-4 border-b border-border">
        <div className="flex gap-2">
          <Button
            variant={currentView === 'home' ? 'default' : 'outline'}
            onClick={() => setCurrentView('home')}
          >
            <Coffee className="h-4 w-4 mr-2" />
            Home
          </Button>
          <Button
            variant={currentView === 'order' ? 'default' : 'outline'}
            onClick={() => isCheckedIn ? setCurrentView('order') : null}
            className="relative"
            disabled={!isCheckedIn}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Order
            {cart.length > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {cart.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={currentView === 'events' ? 'default' : 'outline'}
            onClick={() => setCurrentView('events')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Events
          </Button>
          <Button
            variant={currentView === 'profile' ? 'default' : 'outline'}
            onClick={() => setCurrentView('profile')}
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Home View */}
        {currentView === 'home' && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <Card className="bg-gradient-primary animate-fade-in-up border-0 shadow-elegant overflow-hidden">
              <CardContent className="pt-6 relative">
                <div className="absolute top-0 right-0 opacity-10">
                  <Sparkles className="h-32 w-32" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <Avatar className="h-16 w-16 border-2 border-white/20 shadow-lg">
                    <AvatarFallback className="text-lg bg-white/10 text-white">
                      {clientData?.full_name?.[0]}{clientData?.full_name?.split(' ')[1]?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Welcome back, {clientData?.full_name?.split(' ')[0]}! ✨</h1>
                    <p className="text-white/80">Ready to order your favorites?</p>
                    <Badge variant="accent" className="mt-2">
                      <Award className="h-3 w-3 mr-1" />
                      {membershipStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Status & Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              <Card className={`${isCheckedIn ? "bg-gradient-success" : "bg-gradient-subtle"} border-0 hover-scale`}>
                <CardContent className="pt-6 text-center">
                  <div className={`h-12 w-12 mx-auto mb-3 ${isCheckedIn ? 'animate-pulse-glow' : ''}`}>
                    {isCheckedIn ? (
                      <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 bg-muted/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <QrCode className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className={`text-lg font-bold mb-1 ${isCheckedIn ? 'text-white' : 'text-foreground'}`}>
                    {isCheckedIn ? '✓ Checked In' : 'Not Checked In'}
                  </div>
                  {isCheckedIn && checkInTime && (
                    <p className="text-sm text-white/80 mb-2">Since {checkInTime}</p>
                  )}
                  {!isCheckedIn && (
                    <p className="text-sm text-muted-foreground mb-2">Check in to start ordering</p>
                  )}
                  <Button
                    size="sm"
                    variant={isCheckedIn ? "destructive" : "fun"}
                    onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                    className="mt-2"
                  >
                    {isCheckedIn ? 'Check Out' : 'Check In Now'}
                  </Button>
                </CardContent>
              </Card>
              <Card className="hover-scale">
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 mx-auto mb-3 bg-gradient-accent rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">{checkInsLast30Days}</div>
                  <p className="text-sm text-muted-foreground">Check-ins this month</p>
                </CardContent>
              </Card>
              <Card className="hover-scale">
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary">{cart.length}</div>
                  <p className="text-sm text-muted-foreground">Items in cart</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              {!isCheckedIn && (
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200 animate-bounce-in">
                  <CardContent className="pt-6 text-center">
                    <div className="text-orange-600 mb-3 animate-wiggle">
                      <QrCode className="h-14 w-14 mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-orange-900 mb-2">Please Check In First 👋</h3>
                    <p className="text-orange-700 mb-4">You need to check in at reception before you can place orders.</p>
                    <p className="text-sm text-orange-600">Show your QR code (in Profile tab) to the receptionist.</p>
                  </CardContent>
                </Card>
              )}

              {isCheckedIn && cart.length === 0 && lastOrders.length > 0 && (
                <Card className="border-primary/30 bg-gradient-subtle animate-fade-in">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RotateCcw className="h-5 w-5 text-primary" />
                      Reorder Last Visit
                    </CardTitle>
                    <CardDescription>
                      Quickly reorder from your recent visits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lastOrders.slice(0, 2).map((order, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-card hover:shadow-lg transition-all hover-scale border border-border">
                        <div>
                          <p className="font-semibold">
                            {new Date(order.order_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.total_items} items • {formatCurrency(order.total_price)}
                          </p>
                        </div>
                        <Button 
                          variant="fun"
                          size="sm" 
                          onClick={() => reorderLastOrder(order)}
                          className="shrink-0"
                          disabled={!isCheckedIn}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Reorder
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}


              {/* Favorites */}
              {favoriteDrinks.length > 0 && (
                <Card className="animate-fade-in-up">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500 animate-pulse" />
                      Your Favorites
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {favoriteDrinks.map((drink, index) => (
                        <div 
                          key={drink.id} 
                          className="group p-4 rounded-xl bg-gradient-subtle border border-border hover:shadow-elegant transition-all hover-scale"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-center justify-center mb-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Coffee className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="text-center mb-3">
                            <p className="font-semibold mb-1">{drink.name}</p>
                            <p className="text-lg font-bold text-primary">{formatCurrency(drink.price)}</p>
                          </div>
                          <Button variant="fun" size="sm" className="w-full" onClick={() => addToCart(drink, true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Cart
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Order View */}
        {currentView === 'order' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <Card className="border-primary bg-gradient-primary animate-slide-in-right sticky top-4 z-10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <ShoppingCart className="h-5 w-5" />
                    Your Order ({cart.length} items)
                  </CardTitle>
                  <CardDescription className="text-white/80 text-lg font-semibold">
                    Total: {formatCurrency(getCartTotal())}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                        <div className="flex-1">
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-sm text-white/70">{formatCurrency(item.price)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 bg-white/20 border-white/30 text-white hover:bg-white/30"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-bold text-white">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 bg-white/20 border-white/30 text-white hover:bg-white/30"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={handlePlaceOrder} 
                    className="w-full bg-white text-primary hover:bg-white/90 shadow-glow font-bold" 
                    size="lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Place Order • {formatCurrency(getCartTotal())}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Current Pending Orders */}
            {pendingOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Orders</CardTitle>
                  <CardDescription>Orders being prepared</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div>
                        <p className="font-medium">{order.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {order.quantity} • {formatCurrency(order.price * order.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={order.status === 'preparing' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Drinks Menu */}
            <div className="grid gap-4">
              {filteredDrinks.length === 0 && (
                <Card className="text-center py-12 bg-gradient-subtle">
                  <CardContent>
                    <Coffee className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-semibold mb-2">No drinks found</p>
                    <p className="text-muted-foreground">Try adjusting your search</p>
                  </CardContent>
                </Card>
              )}
              {filteredDrinks.map((drink, index) => (
                <Card 
                  key={drink.id} 
                  className="hover:shadow-elegant transition-all hover-scale animate-fade-in-up group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-xl bg-gradient-accent flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Coffee className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1">{drink.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{drink.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-primary">{formatCurrency(drink.price)}</span>
                          <Badge variant="outline">{drink.category}</Badge>
                        </div>
                      </div>
                      <Button 
                        onClick={() => addToCart(drink)} 
                        variant="fun"
                        size="lg"
                        className="shrink-0"
                      >
                        <Plus className="h-5 w-5 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order History Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Order History</h3>
              <ClientOrderHistory clientId={clientData?.id || ''} />
            </div>
          </div>
        )}

        {/* Profile View */}
        {currentView === 'profile' && (
          <div className="space-y-6">
            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {clientData?.full_name?.[0]}{clientData?.full_name?.split(' ')[1]?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{clientData?.full_name}</h3>
                    <p className="text-muted-foreground">Client</p>
                    <p className="text-sm text-muted-foreground">{clientData?.email}</p>
                    {isCheckedIn && checkInTime && (
                      <Badge variant="default" className="mt-2">
                        <Clock className="h-3 w-3 mr-1" />
                        Checked in at {checkInTime}
                      </Badge>
                    )}
                  </div>
                  <div className="ml-auto">
                    <LogoutButton variant="outline" size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code - Always show in profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Your QR Code
                </CardTitle>
                <CardDescription>
                  {isCheckedIn 
                    ? "Scan this to check out" 
                    : "Show this to reception to check in"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BarcodeCard 
                  barcode={clientData?.client_code || ''} 
                  userName={clientData?.full_name || ''}
                  userEmail={clientData?.email || ''}
                  clientCode={clientData?.client_code || ''}
                  compact={true}
                />
                {isCheckedIn && (
                  <Button 
                    onClick={handleCheckOut} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Check Out & Rate Visit
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Visit Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Visit Analytics
                </CardTitle>
                <CardDescription>Your coworking space activity insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">{totalVisits}</div>
                    <div className="text-sm text-muted-foreground">Total Visits</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">{checkInsLast30Days}</div>
                    <div className="text-sm text-muted-foreground">Last 30 Days</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">{favoriteTimeSlot}</div>
                    <div className="text-sm text-muted-foreground">Favorite Time</div>
                  </div>
                </div>
                {lastVisitDate && (
                  <div className="mt-4 p-3 rounded-lg bg-accent/50 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Last visit: <span className="font-medium">{lastVisitDate}</span>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Receipt */}
            {cart.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Current Order
                  </CardTitle>
                  <CardDescription>Items in your current cart</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span>{item.name} x {item.quantity}</span>
                        <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(getCartTotal())}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{transaction.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.items.join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(transaction.amount)}</p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
            <Button variant="outline" onClick={handleLogout} className="w-full">
              Sign Out
            </Button>
          </div>
        )}

        {/* Events View */}
        {currentView === 'events' && (
          <div className="space-y-6">
            <ClientEvents clientData={clientData} />
          </div>
        )}
      </div>

      {/* Satisfaction Popup */}
      <SatisfactionPopup
        isOpen={showSatisfactionPopup}
        onClose={() => setShowSatisfactionPopup(false)}
        clientId={clientData?.id || ''}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        orderTotal={orderTotal}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
}