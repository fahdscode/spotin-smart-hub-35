import { useState, useEffect } from "react";
import { ArrowLeft, Users, TrendingUp, Calendar, ShoppingCart, Plus, Minus, MapPin, Clock, DollarSign, CreditCard, User, Mail, Phone, Award, FileText, Coffee, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import BarcodeCard from "@/components/BarcodeCard";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Array<{id: number, name: string, price: number, quantity: number}>>([]);
  const [clientData, setClientData] = useState<any>(null);

  useEffect(() => {
    // Get client data from localStorage
    const storedData = localStorage.getItem('spotinClientData');
    if (storedData) {
      const clientData = JSON.parse(storedData);
      setClientData(clientData);
      
      // For non-demo clients, verify the session is still valid
      if (clientData.id !== "demo-client-id") {
        verifyClientSession(clientData.id);
      }
    } else {
      // Redirect to login if no client data found
      navigate('/client-login');
    }
  }, [navigate]);

  const verifyClientSession = async (clientId: string) => {
    try {
      const { data: result, error } = await supabase.rpc('get_client_by_id', {
        client_id: clientId
      });

      const authResult = result as any;
      if (error || !authResult.success) {
        // Session invalid, redirect to login
        localStorage.removeItem('spotinClientData');
        navigate('/client-login');
      }
    } catch (error) {
      console.error('Session verification error:', error);
      // On error, redirect to login for security
      localStorage.removeItem('spotinClientData');
      navigate('/client-login');
    }
  };

  const drinkMenu = [
    { id: 1, name: "Espresso", price: 2.50, category: "Coffee", available: true },
    { id: 2, name: "Cappuccino", price: 3.20, category: "Coffee", available: true },
    { id: 3, name: "Latte", price: 3.80, category: "Coffee", available: true },
    { id: 4, name: "Green Tea", price: 2.00, category: "Tea", available: true },
    { id: 5, name: "Fresh Orange Juice", price: 4.50, category: "Juice", available: false },
    { id: 6, name: "Sparkling Water", price: 1.80, category: "Water", available: true },
  ];

  const upcomingEvents = [
    { 
      id: 1, 
      title: "Networking Night", 
      date: "2024-01-15", 
      time: "18:00", 
      price: 15, 
      capacity: 50, 
      registered: 32,
      category: "Networking"
    },
    { 
      id: 2, 
      title: "Tech Talk: AI in Business", 
      date: "2024-01-18", 
      time: "14:00", 
      price: 25, 
      capacity: 30, 
      registered: 18,
      category: "Workshop"
    },
    { 
      id: 3, 
      title: "Startup Pitch Competition", 
      date: "2024-01-22", 
      time: "16:00", 
      price: 10, 
      capacity: 80, 
      registered: 45,
      category: "Competition"
    },
  ];

  const addToCart = (drink: typeof drinkMenu[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === drink.id);
      if (existing) {
        return prev.map(item => 
          item.id === drink.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...drink, quantity: 1 }];
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCurrentLocation = () => {
    return "Desk A-12"; // This would come from check-in system
  };

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Client Portal</h2>
            <p className="text-muted-foreground">Welcome back! Current location: {getCurrentLocation()}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Current Traffic" value="42" change="70% capacity" icon={Users} variant="info" />
          <MetricCard title="My Orders Today" value="3" change="+1 from yesterday" icon={Coffee} variant="success" />
          <MetricCard title="Events This Month" value="12" change="3 registered" icon={Calendar} variant="default" />
          <MetricCard title="Membership Status" value="Premium" change="Expires in 28 days" icon={User} variant="success" />
        </div>

        <Tabs defaultValue="barcode" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="barcode">My Barcode</TabsTrigger>
            <TabsTrigger value="traffic">Live Traffic</TabsTrigger>
            <TabsTrigger value="drinks">Order Drinks</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="account">My Account</TabsTrigger>
            <TabsTrigger value="receipt">My Receipts</TabsTrigger>
          </TabsList>

          {/* My Barcode Tab */}
          <TabsContent value="barcode" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarcodeCard 
                clientCode={clientData?.clientCode || clientData?.barcode || "C-2025-DEMO01"}
                userName={clientData?.fullName || "Demo Client"}
                userEmail={clientData?.email || "demo@spotin.com"}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Check-in Instructions</CardTitle>
                  <CardDescription>How to use your barcode for seamless access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-700 text-sm font-bold">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Arrive at Reception</p>
                        <p className="text-sm text-muted-foreground">Head to the front desk when you arrive</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-700 text-sm font-bold">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Show Your Barcode</p>
                        <p className="text-sm text-muted-foreground">Display this barcode or share your client ID</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-700 text-sm font-bold">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Get Checked In</p>
                        <p className="text-sm text-muted-foreground">Staff will scan and assign you a workspace</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-orange-700 text-sm font-bold">4</span>
                      </div>
                      <div>
                        <p className="font-medium">Scan Again to Leave</p>
                        <p className="text-sm text-muted-foreground">Show your barcode when checking out</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-orange-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">💡 Pro Tips</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Save the barcode to your phone for quick access</li>
                      <li>• Memorize your client ID: <strong>{clientData?.clientCode || "C-2025-DEMO01"}</strong></li>
                      <li>• Staff can also enter your ID manually if needed</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Live Traffic Tab */}
          <TabsContent value="traffic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Live Crowd Meter
                  </CardTitle>
                  <CardDescription>Current occupancy before you arrive</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-6xl font-bold text-primary">42</div>
                    <p className="text-muted-foreground">People currently inside</p>
                    <Progress value={70} className="h-4" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Low</span>
                      <span className="font-medium text-warning">Moderate</span>
                      <span>High</span>
                    </div>
                    <Badge variant="secondary" className="bg-warning/10 text-warning">
                      Good time to visit
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Today's Traffic Pattern</CardTitle>
                  <CardDescription>Peak hours and predictions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Morning (8-12)</span>
                      <div className="flex items-center gap-2">
                        <Progress value={85} className="w-20 h-2" />
                        <span className="text-sm font-medium">High</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Afternoon (12-17)</span>
                      <div className="flex items-center gap-2">
                        <Progress value={60} className="w-20 h-2" />
                        <span className="text-sm font-medium">Moderate</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Evening (17-22)</span>
                      <div className="flex items-center gap-2">
                        <Progress value={30} className="w-20 h-2" />
                        <span className="text-sm font-medium">Low</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Best time to visit:</strong> After 3 PM for quieter environment
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Order Drinks Tab */}
          <TabsContent value="drinks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Drink Menu</CardTitle>
                    <CardDescription>Order from your current location: {getCurrentLocation()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {drinkMenu.map((drink) => (
                        <Card key={drink.id} className={`transition-all duration-200 ${!drink.available ? 'opacity-50' : 'hover:shadow-card cursor-pointer'}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold">{drink.name}</h3>
                                <p className="text-sm text-muted-foreground">{drink.category}</p>
                              </div>
                              <Badge variant={drink.available ? "default" : "secondary"}>
                                {drink.available ? "Available" : "Out of Stock"}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold">${drink.price.toFixed(2)}</span>
                              <Button 
                                size="sm" 
                                variant="professional"
                                disabled={!drink.available}
                                onClick={() => addToCart(drink)}
                              >
                                Add to Cart
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Your Order
                  </CardTitle>
                  <CardDescription>Delivery to {getCurrentLocation()}</CardDescription>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-bold">Total:</span>
                          <span className="font-bold text-lg">${getCartTotal().toFixed(2)}</span>
                        </div>
                        <Button variant="professional" className="w-full" size="lg">
                          Place Order
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Browse and register for SpotIN events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.map((event) => (
                    <Card key={event.id} className="hover:shadow-card transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{event.category}</Badge>
                              <span className="text-lg font-bold text-primary">${event.price}</span>
                            </div>
                            <h3 className="font-bold text-lg">{event.title}</h3>
                          </div>
                          
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {event.date}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {event.time}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {event.registered}/{event.capacity} registered
                            </div>
                          </div>

                          <Progress value={(event.registered / event.capacity) * 100} className="h-2" />
                          
                          <Button variant="professional" className="w-full">
                            <QrCode className="h-4 w-4" />
                            Register & Get Ticket
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Manage your profile and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <p className="text-foreground">John Smith</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-foreground">john.smith@email.com</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <p className="text-foreground">+1 (555) 123-4567</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Location</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <p className="text-foreground">{getCurrentLocation()}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Membership Status</CardTitle>
                  <CardDescription>Your current plan and benefits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Badge variant="default" className="bg-success text-success-foreground mb-2">
                      Premium Member
                    </Badge>
                    <p className="text-sm text-muted-foreground">Valid until February 15, 2024</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Hot Desk Access</span>
                      <span className="text-success">✓ Unlimited</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Meeting Room Hours</span>
                      <span className="text-success">✓ 20h/month</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Event Discounts</span>
                      <span className="text-success">✓ 15% off</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Drink Credits</span>
                      <span className="text-success">✓ $50/month</span>
                    </div>
                  </div>

                  <Button variant="professional" className="w-full">
                    <CreditCard className="h-4 w-4" />
                    Manage Subscription
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Receipts Tab */}
          <TabsContent value="receipt" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent purchases and receipts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Recent Receipt */}
                  <Card className="border border-success/20 bg-success/5">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Receipt #SPT-2024-001</CardTitle>
                          <CardDescription>Today, 2:30 PM</CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-success">$12.50</p>
                          <p className="text-sm text-success">Paid</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Cappuccino x2</span>
                          <span>$9.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Croissant x1</span>
                          <span>$3.50</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-medium">
                          <span>Total</span>
                          <span>$12.50</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">Payment Method: Card ending in ****1234</p>
                        <p className="text-sm text-muted-foreground">Location: SpotIN Downtown</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Previous Receipts */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">Receipt #SPT-2024-002</p>
                          <p className="text-sm text-muted-foreground">Yesterday, 10:15 AM</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">$7.50</p>
                          <p className="text-sm text-success">Paid</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Latte x1, Muffin x1
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">Day Pass #DP-2024-045</p>
                          <p className="text-sm text-muted-foreground">Dec 15, 2024</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">$25.00</p>
                          <p className="text-sm text-success">Paid</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Hot Desk - Full Day Access
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">Membership #MEM-PRO-001</p>
                          <p className="text-sm text-muted-foreground">Dec 1, 2024</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">$120.00</p>
                          <p className="text-sm text-success">Paid</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Professional Monthly Membership
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6 flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <FileText className="h-4 w-4" />
                    Export All Receipts
                  </Button>
                  <Button variant="professional" className="flex-1">
                    <DollarSign className="h-4 w-4" />
                    Request Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientDashboard;