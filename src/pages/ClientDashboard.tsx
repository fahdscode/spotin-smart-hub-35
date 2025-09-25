import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MetricCard from '@/components/MetricCard';
import SpotinHeader from '@/components/SpotinHeader';
import BarcodeCard from '@/components/BarcodeCard';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, MapPin, Coffee, Calendar, CreditCard, Download, FileText, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  price: number;
  capacity: number;
  registered_attendees: number;
  category: string;
  location: string;
}
interface TrafficData {
  current_occupancy: number;
  max_capacity: number;
  area: string;
}
export default function ClientDashboard() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [checkInStatus, setCheckInStatus] = useState<string>('checked_out');
  useEffect(() => {
    const storedClientData = localStorage.getItem('clientData');
    if (storedClientData) {
      try {
        const parsedData = JSON.parse(storedClientData);
        console.log('Client data loaded:', parsedData); // Debug log
        setClientData(parsedData);
        verifyClientSession(parsedData.id);
        fetchRealData();
        fetchCheckInStatus(parsedData.id);
      } catch (error) {
        console.error('Error parsing client data:', error);
        navigate('/client-login');
      }
    } else {
      navigate('/client-login');
    }
    setLoading(false);
  }, [navigate]);
  const verifyClientSession = async (clientId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.rpc('get_client_by_id', {
        client_id: clientId
      });
      const authResult = data as any;
      if (error || !authResult?.success) {
        throw new Error('Invalid session');
      }
    } catch (error) {
      console.error('Session verification failed:', error);
      handleLogout();
    }
  };
  const fetchRealData = async () => {
    try {
      // Fetch drinks
      const {
        data: drinksData,
        error: drinksError
      } = await supabase.from('drinks').select('*').eq('is_available', true).order('category', {
        ascending: true
      });
      if (drinksError) throw drinksError;
      setDrinks(drinksData || []);

      // Fetch events
      const {
        data: eventsData,
        error: eventsError
      } = await supabase.from('events').select('*').eq('is_active', true).gte('event_date', new Date().toISOString().split('T')[0]).order('event_date', {
        ascending: true
      });
      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch traffic data
      const {
        data: trafficDataResult,
        error: trafficError
      } = await supabase.from('traffic_data').select('*').order('timestamp', {
        ascending: false
      }).limit(3);
      if (trafficError) throw trafficError;
      setTrafficData(trafficDataResult || []);
    } catch (error) {
      console.error('Error fetching real data:', error);
      toast({
        title: "Error",
        description: "Failed to load latest data. Please refresh the page.",
        variant: "destructive"
      });
    }
  };
  const fetchCheckInStatus = async (clientId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.rpc('get_client_check_in_status', {
        p_client_id: clientId
      });
      if (error) throw error;
      setCheckInStatus(data || 'checked_out');
    } catch (error) {
      console.error('Error fetching check-in status:', error);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('spotinClientData');
    navigate('/client-login');
  };
  const addToCart = (drink: Drink) => {
    const existingItem = cart.find(item => item.id === drink.id);
    if (existingItem) {
      setCart(cart.map(item => item.id === drink.id ? {
        ...item,
        quantity: item.quantity + 1
      } : item));
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
  };
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };
  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item => item.id === itemId ? {
        ...item,
        quantity: newQuantity
      } : item));
    }
  };
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };
  const getCurrentLocation = () => {
    return checkInStatus === 'checked_in' ? "Checked in - Active session" : "Not checked in";
  };
  const getTotalOccupancy = () => {
    return trafficData.reduce((total, area) => total + area.current_occupancy, 0);
  };
  const getMaxCapacity = () => {
    return trafficData.reduce((total, area) => total + area.max_capacity, 0);
  };
  if (loading || !clientData) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <SpotinHeader />
      
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header Section - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Welcome back, {clientData.fullName}!
            </h1>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Member ID: {clientData.clientCode}</p>
              <p className="text-sm text-muted-foreground">{clientData.jobTitle}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="self-start sm:self-auto">
            Sign Out
          </Button>
        </div>

        {/* Metrics Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <MetricCard title="Current Crowd" value={getTotalOccupancy().toString()} change={`${Math.round(getTotalOccupancy() / getMaxCapacity() * 100)}% occupied`} icon={Users} variant="info" />
          <MetricCard title="Check-in Status" value={checkInStatus === 'checked_in' ? 'Checked In' : 'Checked Out'} change={getCurrentLocation()} icon={Clock} variant={checkInStatus === 'checked_in' ? 'success' : 'default'} />
          <MetricCard title="Cart Total" value={cart.length > 0 ? `$${getCartTotal().toFixed(2)}` : '$0.00'} change={cart.length > 0 ? 'Ready to order' : 'Cart is empty'} icon={CreditCard} variant={cart.length > 0 ? 'success' : 'default'} />
          <MetricCard title="Current Location" value={getCurrentLocation()} change={checkInStatus === 'checked_in' ? 'Use barcode to check out' : 'Use barcode to check in'} icon={MapPin} variant={checkInStatus === 'checked_in' ? 'success' : 'warning'} />
        </div>

        {/* Tabs - Mobile Optimized Navigation */}
        <Tabs defaultValue="barcode" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 min-w-max sm:min-w-0 my-[40px]">
              <TabsTrigger value="barcode" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                My Barcode
              </TabsTrigger>
              <TabsTrigger value="traffic" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                Live Traffic
              </TabsTrigger>
              <TabsTrigger value="drinks" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                Order Drinks
              </TabsTrigger>
              <TabsTrigger value="events" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                Events
              </TabsTrigger>
              <TabsTrigger value="account" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4 mx-0 py-[25px]">
                My Account
              </TabsTrigger>
              <TabsTrigger value="receipts" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                My Receipts
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Barcode Tab - Mobile Optimized */}
          <TabsContent value="barcode" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Your Check-in Barcode</CardTitle>
                <CardDescription className="text-sm">
                  Show this barcode to reception staff for quick check-in and check-out
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <BarcodeCard clientCode={clientData.clientCode} barcode={clientData.barcode} userName={clientData.fullName} userEmail={clientData.email} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Traffic Tab - Mobile Optimized */}
          <TabsContent value="traffic" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Live Space Traffic</CardTitle>
                <CardDescription className="text-sm">
                  Real-time occupancy and crowd information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-semibold">Live Crowd Meter</h3>
                    <Badge variant="secondary" className="self-start">Real-time</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Total Occupancy</span>
                      <span className="font-medium">{getTotalOccupancy()}/{getMaxCapacity()}</span>
                    </div>
                    <Progress value={getTotalOccupancy() / getMaxCapacity() * 100} className="w-full h-3" />
                    <p className="text-xs text-muted-foreground">Updated in real-time</p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm sm:text-base">Area Breakdown</h4>
                    <div className="space-y-3">
                      {trafficData.map((area, index) => <div key={index} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="capitalize font-medium text-sm">
                              {area.area.replace('_', ' ')}
                            </span>
                            <span className="text-sm font-medium">
                              {area.current_occupancy}/{area.max_capacity}
                            </span>
                          </div>
                          <Progress value={area.current_occupancy / area.max_capacity * 100} className="w-full h-2" />
                        </div>)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drinks Tab - Mobile Optimized */}
          <TabsContent value="drinks" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Drink Menu Card */}
              <Card className="order-1">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl">Drink Menu</CardTitle>
                  <CardDescription className="text-sm">Fresh drinks available for order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-semibold">Available Drinks</h3>
                    <Badge variant="outline" className="self-start">
                      {drinks.filter(d => d.is_available).length} available
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                    {drinks.filter(drink => drink.is_available).map(drink => <div key={drink.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{drink.name}</h4>
                            <Badge variant="secondary" className="text-xs self-start">{drink.category}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{drink.description}</p>
                          <p className="text-sm font-semibold text-primary">${Number(drink.price).toFixed(2)}</p>
                        </div>
                        <Button onClick={() => addToCart(drink)} size="sm" className="shrink-0 ml-2">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>)}
                  </div>
                </CardContent>
              </Card>

              {/* Order Cart Card */}
              <Card className="order-2 lg:order-2">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl">Your Order</CardTitle>
                  <CardDescription className="text-sm">Review and place your drink order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm sm:text-base">Your Cart</h4>
                    <Badge variant="secondary" className="text-xs">
                      {cart.length} {cart.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                  
                  {cart.length === 0 ? <div className="text-center py-8">
                      <Coffee className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">No items in cart</p>
                      <p className="text-xs text-muted-foreground mt-1">Add drinks from the menu to get started</p>
                    </div> : <div className="space-y-3">
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {cart.map(item => <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1 min-w-0 pr-2">
                              <span className="font-medium text-sm block truncate">{item.name}</span>
                              <div className="flex items-center gap-2 mt-2">
                                <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="h-6 w-6 p-0 shrink-0">
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm w-8 text-center font-medium">{item.quantity}</span>
                                <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="h-6 w-6 p-0 shrink-0">
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>)}
                      </div>
                      
                      <div className="border-t pt-3 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total:</span>
                          <span className="font-bold text-lg text-primary">${getCartTotal().toFixed(2)}</span>
                        </div>
                        <Button className="w-full" size="lg">
                          <Coffee className="mr-2 h-4 w-4" />
                          Place Order
                        </Button>
                      </div>
                    </div>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab - Mobile Optimized */}
          <TabsContent value="events" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Upcoming Events</CardTitle>
                <CardDescription className="text-sm">Register for workshops, networking events, and more</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-semibold">Upcoming Events</h3>
                  <Badge variant="outline" className="self-start">{events.length} events</Badge>
                </div>
                
                <div className="space-y-4">
                  {events.length === 0 ? <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">No upcoming events</p>
                      <p className="text-xs text-muted-foreground mt-1">Check back later for new events</p>
                    </div> : events.map(event => <Card key={event.id} className="p-4 border bg-card">
                        <div className="space-y-3">
                          {/* Event Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                                <h4 className="font-semibold text-base truncate">{event.title}</h4>
                                <Badge variant="secondary" className="self-start text-xs">{event.category}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="font-semibold text-base mb-2">
                                {Number(event.price) === 0 ? 'Free' : `$${Number(event.price).toFixed(2)}`}
                              </div>
                              <Button size="sm" disabled={event.registered_attendees >= event.capacity}>
                                {event.registered_attendees >= event.capacity ? 'Full' : 'Register'}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Event Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {new Date(event.event_date).toLocaleDateString()} • {event.start_time} - {event.end_time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 shrink-0" />
                              <span>{event.registered_attendees}/{event.capacity} registered</span>
                            </div>
                            {event.location && <div className="flex items-center gap-2 sm:col-span-2">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>}
                          </div>
                        </div>
                      </Card>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab - Mobile Optimized */}
          <TabsContent value="account" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Account Information Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl">Account Information</CardTitle>
                  <CardDescription className="text-sm">Your profile and membership details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="text-base font-medium">{clientData.fullName}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-base">{clientData.phone}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-base break-all">{clientData.email}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Member ID</label>
                      <p className="text-base font-mono">{clientData.clientCode}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Membership Status Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl">Membership Status</CardTitle>
                  <CardDescription className="text-sm">Current membership plan and benefits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Current Plan</label>
                      <Badge variant="secondary" className="self-start">Basic Member</Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                      <p className="text-base">January 2024</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Benefits</label>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0"></div>
                          <span>Unlimited day use</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0"></div>
                          <span>Free coffee (2 cups/day)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0"></div>
                          <span>Meeting room discounts</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0"></div>
                          <span>Event priority booking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Receipts Tab - Mobile Optimized */}
          <TabsContent value="receipts" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Transaction History</CardTitle>
                <CardDescription className="text-sm">Your recent purchases and receipts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-semibold">Recent Transactions</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <FileText className="mr-2 h-4 w-4" />
                      Request Invoice
                    </Button>
                  </div>
                </div>
                
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">No recent transactions found</p>
                  <p className="text-xs text-muted-foreground">
                    Your purchase history will appear here after you place orders
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}