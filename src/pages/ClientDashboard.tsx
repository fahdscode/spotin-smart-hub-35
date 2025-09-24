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
  fullName: string;
  phone: string;
  email: string;
  barcode: string;
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
  const { toast } = useToast();
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
      const { data, error } = await supabase.rpc('get_client_by_id', {
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
      const { data: drinksData, error: drinksError } = await supabase
        .from('drinks')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (drinksError) throw drinksError;
      setDrinks(drinksData || []);

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch traffic data
      const { data: trafficDataResult, error: trafficError } = await supabase
        .from('traffic_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(3);

      if (trafficError) throw trafficError;
      setTrafficData(trafficDataResult || []);

    } catch (error) {
      console.error('Error fetching real data:', error);
      toast({
        title: "Error",
        description: "Failed to load latest data. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const fetchCheckInStatus = async (clientId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_client_check_in_status', {
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
      setCart(cart.map(item => 
        item.id === drink.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { id: drink.id, name: drink.name, price: drink.price, quantity: 1 }]);
    }
    
    toast({
      title: "Added to cart",
      description: `${drink.name} added to your order`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {clientData.fullName}!</h1>
            <p className="text-muted-foreground">Member ID: {clientData.clientCode}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Current Crowd"
            value={getTotalOccupancy().toString()}
            change={`${Math.round((getTotalOccupancy() / getMaxCapacity()) * 100)}% occupied`}
            icon={Users}
            variant="info"
          />
          <MetricCard
            title="Check-in Status"
            value={checkInStatus === 'checked_in' ? 'Checked In' : 'Checked Out'}
            change={getCurrentLocation()}
            icon={Clock}
            variant={checkInStatus === 'checked_in' ? 'success' : 'default'}
          />
          <MetricCard
            title="Cart Total"
            value={cart.length > 0 ? `$${getCartTotal().toFixed(2)}` : '$0.00'}
            change={cart.length > 0 ? 'Ready to order' : 'Cart is empty'}
            icon={CreditCard}
            variant={cart.length > 0 ? 'success' : 'default'}
          />
          <MetricCard
            title="Current Location"
            value={getCurrentLocation()}
            change={checkInStatus === 'checked_in' ? 'Use barcode to check out' : 'Use barcode to check in'}
            icon={MapPin}
            variant={checkInStatus === 'checked_in' ? 'success' : 'warning'}
          />
        </div>

        <Tabs defaultValue="barcode" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="barcode">My Barcode</TabsTrigger>
            <TabsTrigger value="traffic">Live Traffic</TabsTrigger>
            <TabsTrigger value="drinks">Order Drinks</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="account">My Account</TabsTrigger>
            <TabsTrigger value="receipts">My Receipts</TabsTrigger>
          </TabsList>

          <TabsContent value="barcode" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Check-in Barcode</CardTitle>
                <CardDescription>
                  Show this barcode to reception staff for quick check-in and check-out
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarcodeCard 
                  clientCode={clientData.clientCode}
                  barcode={clientData.barcode}
                  userName={clientData.fullName}
                  userEmail={clientData.email}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Space Traffic</CardTitle>
                <CardDescription>
                  Real-time occupancy and crowd information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Live Crowd Meter</h3>
                    <Badge variant="secondary">Real-time</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Occupancy</span>
                      <span>{getTotalOccupancy()}/{getMaxCapacity()}</span>
                    </div>
                    <Progress value={(getTotalOccupancy() / getMaxCapacity()) * 100} className="w-full" />
                    <p className="text-xs text-muted-foreground">Updated in real-time</p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Area Breakdown</h4>
                    <div className="space-y-2">
                      {trafficData.map((area, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="capitalize">{area.area.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span>{area.current_occupancy}/{area.max_capacity}</span>
                            <Progress 
                              value={(area.current_occupancy / area.max_capacity) * 100} 
                              className="w-16 h-2" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drinks" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Drink Menu</CardTitle>
                  <CardDescription>Fresh drinks available for order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Drink Menu</h3>
                      <Badge variant="outline">{drinks.filter(d => d.is_available).length} available</Badge>
                    </div>
                    
                    <div className="grid gap-3">
                      {drinks.filter(drink => drink.is_available).map((drink) => (
                        <div key={drink.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{drink.name}</h4>
                              <Badge variant="secondary" className="text-xs">{drink.category}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{drink.description}</p>
                            <p className="text-sm font-medium">${Number(drink.price).toFixed(2)}</p>
                          </div>
                          <Button 
                            onClick={() => addToCart(drink)}
                            size="sm"
                            className="ml-2"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Order</CardTitle>
                  <CardDescription>Review and place your drink order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium">Your Cart ({cart.length} items)</h4>
                    {cart.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No items in cart</p>
                    ) : (
                      <div className="space-y-2">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex-1">
                              <span className="font-medium">{item.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm w-8 text-center">{item.quantity}</span>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2">
                          <div className="flex justify-between font-medium">
                            <span>Total:</span>
                            <span>${getCartTotal().toFixed(2)}</span>
                          </div>
                        </div>
                        <Button className="w-full">
                          <Coffee className="mr-2 h-4 w-4" />
                          Place Order
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Register for workshops, networking events, and more</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Upcoming Events</h3>
                    <Badge variant="outline">{events.length} events</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {events.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming events</p>
                    ) : (
                      events.map((event) => (
                        <Card key={event.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{event.title}</h4>
                                <Badge variant="secondary">{event.category}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(event.event_date).toLocaleDateString()} • {event.start_time} - {event.end_time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>{event.registered_attendees}/{event.capacity} registered</span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium mb-2">
                                {Number(event.price) === 0 ? 'Free' : `$${Number(event.price).toFixed(2)}`}
                              </div>
                              <Button size="sm" disabled={event.registered_attendees >= event.capacity}>
                                {event.registered_attendees >= event.capacity ? 'Full' : 'Register'}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your profile and membership details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <p className="text-sm">{clientData.fullName}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <p className="text-sm">{clientData.phone}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm">{clientData.email}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Member ID</label>
                    <p className="text-sm">{clientData.clientCode}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Membership Status</CardTitle>
                  <CardDescription>Current membership plan and benefits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Plan</label>
                    <Badge variant="secondary">Basic Member</Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Member Since</label>
                    <p className="text-sm">January 2024</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Benefits</label>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Unlimited day use</li>
                      <li>• Free coffee (2 cups/day)</li>
                      <li>• Meeting room discounts</li>
                      <li>• Event priority booking</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="receipts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent purchases and receipts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Recent Transactions</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        Request Invoice
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No recent transactions found</p>
                    <p className="text-xs text-muted-foreground">
                      Your purchase history will appear here after you place orders
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}