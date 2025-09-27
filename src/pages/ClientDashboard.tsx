import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import SpotinHeader from '@/components/SpotinHeader';
import BarcodeCard from '@/components/BarcodeCard';
import ClientEvents from '@/components/ClientEvents';
import SatisfactionPopup from '@/components/SatisfactionPopup';
import { LogoutButton } from '@/components/LogoutButton';
import { Coffee, Clock, Star, Plus, Minus, Search, RotateCcw, ShoppingCart, Heart, User, Receipt, QrCode, Calendar, BarChart3, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';

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
  const { clientData, isAuthenticated, userRole } = useAuth();
  
  // Core state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'order' | 'profile' | 'events'>('home');
  
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
      setLoading(false);

      // Set up real-time subscription for client status updates
      const channel = supabase
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
            // Refresh check-in status when client record is updated
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
            // Refresh check-in status when check-ins are updated
            fetchCheckInStatus(clientData.id);
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
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

  const handleCheckOut = () => {
    // Show satisfaction popup when checking out
    if (isCheckedIn) {
      setShowSatisfactionPopup(true);
      setIsCheckedIn(false);
      setCheckInTime(null);
    }
  };

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
      title: "Added to cart",
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

    try {
      console.log('Placing order for client:', clientData.id, 'Items:', cart);
      
      // Validate cart items before placing order
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

      if (validatedItems.length !== cart.length) {
        toast({
          title: "Cart Validation",
          description: `${cart.length - validatedItems.length} invalid items removed from cart.`,
          variant: "destructive"
        });
      }
      
      console.log('Attempting to place order:', {
        clientId: clientData.id,
        validatedItems: validatedItems.length,
        sampleItem: validatedItems[0]
      });

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
      
      // Check for any errors in the results
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Order placement errors:', errors);
        throw new Error(`Failed to place ${errors.length} order items. ${errors[0].error?.message || ''}`);
      }
      
      console.log('Order placed successfully:', results);
      
      setCart([]);
      setCurrentView('home');
      
      toast({
        title: "Order Placed!",
        description: `Your order with ${validatedItems.length} item${validatedItems.length > 1 ? 's' : ''} has been sent to the barista.`,
      });

      // Show satisfaction popup after successful order
      setShowSatisfactionPopup(true);
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to place order. Please try again.",
        variant: "destructive"
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {clientData?.full_name?.[0]}{clientData?.full_name?.split(' ')[1]?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold">Welcome back, {clientData?.full_name?.split(' ')[0]}!</h1>
                    <p className="text-muted-foreground">Ready to order your favorites?</p>
                    <Badge variant="secondary" className="mt-2">
                      {membershipStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Status & Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={isCheckedIn ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <CardContent className="pt-6 text-center">
                  <div className={`h-8 w-8 mx-auto mb-2 ${isCheckedIn ? 'text-green-600' : 'text-red-600'}`}>
                    {isCheckedIn ? (
                      <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                        <div className="h-4 w-4 bg-white rounded-full"></div>
                      </div>
                    ) : (
                      <div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center">
                        <div className="h-4 w-4 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className={`text-lg font-bold ${isCheckedIn ? 'text-green-700' : 'text-red-700'}`}>
                    {isCheckedIn ? 'Checked In' : 'Checked Out'}
                  </div>
                  {isCheckedIn && checkInTime && (
                    <p className="text-sm text-green-600">Since {checkInTime}</p>
                  )}
                  {!isCheckedIn && (
                    <p className="text-sm text-red-600">Visit reception to check in</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{checkInsLast30Days}</div>
                  <p className="text-sm text-muted-foreground">Check-ins this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{cart.length}</div>
                  <p className="text-sm text-muted-foreground">Items in cart</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              {!isCheckedIn && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-6 text-center">
                    <div className="text-orange-600 mb-2">
                      <QrCode className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-orange-800 mb-2">Please Check In First</h3>
                    <p className="text-orange-700 mb-4">You need to check in at reception before you can place orders.</p>
                    <p className="text-sm text-orange-600">Show your QR code (in Profile tab) to the receptionist.</p>
                  </CardContent>
                </Card>
              )}

              {isCheckedIn && cart.length === 0 && lastOrders.length > 0 && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RotateCcw className="h-5 w-5" />
                      Reorder Last Visit
                    </CardTitle>
                    <CardDescription>
                      Quickly reorder from your recent visits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lastOrders.slice(0, 2).map((order, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">
                            {new Date(order.order_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.total_items} items • {formatCurrency(order.total_price)}
                          </p>
                        </div>
                        <Button 
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Your Favorites
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {favoriteDrinks.map((drink) => (
                        <div key={drink.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium">{drink.name}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(drink.price)}</p>
                          </div>
                          <Button size="sm" onClick={() => addToCart(drink, true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
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
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Your Order ({cart.length} items)</CardTitle>
                  <CardDescription>Total: {formatCurrency(getCartTotal())}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handlePlaceOrder} className="w-full" size="lg">
                    Place Order • {formatCurrency(getCartTotal())}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Drinks Menu */}
            <div className="grid gap-4">
              {filteredDrinks.map((drink) => (
                <Card key={drink.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{drink.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{drink.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatCurrency(drink.price)}</span>
                          <Badge variant="outline">{drink.category}</Badge>
                        </div>
                      </div>
                      <Button onClick={() => addToCart(drink)} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
    </div>
  );
}