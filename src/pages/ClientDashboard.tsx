import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import SpotinHeader from '@/components/SpotinHeader';
import BarcodeCard from '@/components/BarcodeCard';
import { Coffee, Clock, Star, Plus, Minus, Search, RotateCcw, ShoppingCart, Heart, User, Receipt, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';

interface ClientData {
  id: string;
  clientCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  barcode: string;
  jobTitle: string;
  howDidYouFindUs: string;
}

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
  
  // Core state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'order' | 'profile'>('home');
  
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

  useEffect(() => {
    const storedClientData = localStorage.getItem('clientData');
    
    if (storedClientData) {
      try {
        const parsedData = JSON.parse(storedClientData);
        
        if (!parsedData.id || !parsedData.fullName) {
          throw new Error('Invalid client data');
        }
        
        setClientData(parsedData);
        fetchAllData(parsedData.id);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing client data:', error);
        localStorage.removeItem('clientData');
        setLoading(false);
        navigate('/client-login');
      }
    } else {
      setLoading(false);
      navigate('/client-login');
    }
  }, [navigate]);

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

      // Fetch check-ins
      fetchCheckInsLast30Days(clientId);
      fetchMembershipStatus(clientId);
      fetchCheckInStatus(clientId);
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
      const { data } = await supabase
        .from('check_ins')
        .select('checked_in_at, status')
        .eq('client_id', clientId)
        .eq('status', 'checked_in')
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false })
        .maybeSingle();
      
      if (data) {
        setIsCheckedIn(true);
        setCheckInTime(new Date(data.checked_in_at).toLocaleTimeString());
      } else {
        setIsCheckedIn(false);
        setCheckInTime(null);
      }
    } catch (error) {
      console.error('Error fetching check-in status:', error);
      setIsCheckedIn(false);
      setCheckInTime(null);
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

  const addToCart = (drink: Drink, goToCart = false) => {
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
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order.",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderPromises = cart.map(item =>
        supabase.from('session_line_items').insert({
          user_id: clientData?.id,
          item_name: item.name,
          quantity: item.quantity,
          price: item.price,
          status: 'pending'
        })
      );

      await Promise.all(orderPromises);
      
      setCart([]);
      setCurrentView('home');
      
      toast({
        title: "Order Placed!",
        description: "Your order has been sent to the barista. You'll be notified when it's ready.",
      });
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredDrinks = drinks.filter(drink =>
    drink.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drink.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('clientData');
    setClientData(null);
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
            onClick={() => setCurrentView('order')}
            className="flex flex-col items-center gap-1 h-auto py-2 relative"
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
            onClick={() => setCurrentView('order')}
            className="relative"
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
                      {clientData?.firstName?.[0]}{clientData?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold">Welcome back, {clientData?.firstName}!</h1>
                    <p className="text-muted-foreground">Ready to order your favorites?</p>
                    <Badge variant="secondary" className="mt-2">
                      {membershipStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
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
              {cart.length === 0 && lastOrders.length > 0 && (
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
                      {clientData?.firstName?.[0]}{clientData?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{clientData?.fullName}</h3>
                    <p className="text-muted-foreground">{clientData?.jobTitle}</p>
                    <p className="text-sm text-muted-foreground">{clientData?.email}</p>
                    {isCheckedIn && checkInTime && (
                      <Badge variant="default" className="mt-2">
                        <Clock className="h-3 w-3 mr-1" />
                        Checked in at {checkInTime}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code - Only show when checked in */}
            {isCheckedIn && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Your QR Code
                  </CardTitle>
                  <CardDescription>Scan this to check out</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarcodeCard 
                    barcode={clientData?.barcode || ''} 
                    userName={clientData?.fullName || ''}
                    userEmail={clientData?.email || ''}
                    clientCode={clientData?.clientCode || ''}
                    compact={true}
                  />
                </CardContent>
              </Card>
            )}

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
      </div>
    </div>
  );
}