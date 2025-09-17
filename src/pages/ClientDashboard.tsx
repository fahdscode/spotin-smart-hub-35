import { useState } from "react";
import { ArrowLeft, Coffee, Users, Calendar, User, MapPin, Clock, ShoppingCart, QrCode, TrendingUp, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import { useNavigate } from "react-router-dom";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Array<{id: number, name: string, price: number, quantity: number}>>([]);

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

        <Tabs defaultValue="traffic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="traffic">Live Traffic</TabsTrigger>
            <TabsTrigger value="drinks">Order Drinks</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="account">My Account</TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </div>
  );
};

export default ClientDashboard;