import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import MetricCard from '@/components/MetricCard';
import SpotinHeader from '@/components/SpotinHeader';
import BarcodeCard from '@/components/BarcodeCard';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, MapPin, Coffee, Calendar, CreditCard, Download, FileText, Plus, Minus, Star, Award, Camera, Save, Edit3, Search, Filter, Heart } from 'lucide-react';
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
  
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [checkInStatus, setCheckInStatus] = useState<string>('checked_out');
  const [checkInsLast30Days, setCheckInsLast30Days] = useState<number>(0);
  const [membershipStatus, setMembershipStatus] = useState<string>('No active membership');
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    jobTitle: '',
    profileImage: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favoriteDrinks, setFavoriteDrinks] = useState<Drink[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  useEffect(() => {
    const storedClientData = localStorage.getItem('clientData');
    console.log('Checking for stored client data...', !!storedClientData); // Debug log
    
    if (storedClientData) {
      try {
        const parsedData = JSON.parse(storedClientData);
        console.log('Client data loaded:', parsedData); // Debug log
        
        if (!parsedData.id || !parsedData.fullName) {
          console.error('Invalid client data structure:', parsedData);
          throw new Error('Invalid client data');
        }
        
        setClientData(parsedData);
        setProfileData({
          fullName: parsedData.fullName || '',
          email: parsedData.email || '',
          phone: parsedData.phone || '',
          jobTitle: parsedData.jobTitle || '',
          profileImage: ''
        });
        
        // Verify session and load data
        verifyClientSession(parsedData.id);
        fetchRealData();
        fetchCheckInStatus(parsedData.id);
        fetchCheckInsLast30Days(parsedData.id);
        fetchMembershipStatus(parsedData.id);
        
        fetchFavoriteDrinks(parsedData.id);
        loadMockTransactions();
        
        setLoading(false);
      } catch (error) {
        console.error('Error parsing client data:', error);
        localStorage.removeItem('clientData'); // Clean up invalid data
        setLoading(false);
        navigate('/client-login');
      }
    } else {
      console.log('No client data found, redirecting to login');
      setLoading(false);
      navigate('/client-login');
    }
  }, [navigate]);
  const verifyClientSession = async (clientId: string) => {
    try {
      console.log('Verifying client session for ID:', clientId);
      const {
        data,
        error
      } = await supabase.rpc('get_client_by_id', {
        client_id: clientId
      });
      const authResult = data as any;
      
      console.log('Session verification result:', { data, error, authResult });
      
      if (error || !authResult?.success) {
        console.error('Session verification failed:', { error, authResult });
        throw new Error('Invalid session');
      }
      
      console.log('Session verification successful');
    } catch (error) {
      console.error('Session verification failed:', error);
      toast({
        title: "Session Expired",
        description: "Please log in again.",
        variant: "destructive"
      });
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
      
      // Load mock favorites after drinks are loaded
      setTimeout(() => {
        if (favoriteDrinks.length === 0) {
          loadMockFavorites();
        }
      }, 1000);

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

  const fetchCheckInsLast30Days = async (clientId: string) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('check_in_logs')
        .select('*')
        .eq('client_id', clientId)
        .eq('action', 'checked_in')
        .gte('timestamp', thirtyDaysAgo.toISOString());
      
      if (error) throw error;
      
      // Use real data if available, otherwise use mock data
      const checkInCount = data?.length || 0;
      setCheckInsLast30Days(checkInCount > 0 ? checkInCount : 12); // Mock: 12 check-ins
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      setCheckInsLast30Days(12); // Mock fallback
    }
  };

  const fetchMembershipStatus = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_memberships')
        .select('plan_name, is_active')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching membership:', error);
      }
      
      // Use real data if available, otherwise use mock data
      setMembershipStatus(data?.plan_name || 'Premium Member'); // Mock: Premium Member
    } catch (error) {
      console.error('Error fetching membership:', error);
      setMembershipStatus('Premium Member'); // Mock fallback
    }
  };


  const handleProfileSave = async () => {
    try {
      // Update localStorage
      const updatedClientData = {
        ...clientData,
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        jobTitle: profileData.jobTitle
      };
      
      localStorage.setItem('clientData', JSON.stringify(updatedClientData));
      setClientData(updatedClientData as ClientData);
      setIsEditingProfile(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchFavoriteDrinks = async (clientId: string) => {
    try {
      // Get most ordered drinks from session_line_items
      const { data, error } = await supabase
        .from('session_line_items')
        .select('item_name, quantity')
        .eq('user_id', clientId)
        .eq('status', 'completed');

      if (error) throw error;

      // Count drink orders
      const drinkCounts: { [key: string]: number } = {};
      data?.forEach(item => {
        drinkCounts[item.item_name] = (drinkCounts[item.item_name] || 0) + item.quantity;
      });

      // Get top 3 most ordered drinks
      const topDrinks = Object.entries(drinkCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([name]) => name);

      // Get drink details for favorite drinks
      if (topDrinks.length > 0) {
        const { data: drinkDetails, error: drinkError } = await supabase
          .from('drinks')
          .select('*')
          .in('name', topDrinks)
          .eq('is_available', true);

        if (!drinkError && drinkDetails) {
          setFavoriteDrinks(drinkDetails);
        } else {
          loadMockFavorites(); // Load mock favorites if no real data
        }
      } else {
        loadMockFavorites(); // Load mock favorites if no order history
      }
    } catch (error) {
      console.error('Error fetching favorite drinks:', error);
      loadMockFavorites(); // Load mock favorites on error
    }
  };

  const loadMockFavorites = () => {
    // Mock favorite drinks based on available drinks
    const mockFavorites = drinks.filter(drink => 
      ['Cappuccino', 'Latte', 'Americano'].includes(drink.name) && drink.is_available
    ).slice(0, 3);
    setFavoriteDrinks(mockFavorites);
  };

  const loadMockTransactions = () => {
    // Mock transaction data
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
      },
      {
        id: '3',
        date: '2024-09-18',
        amount: 22.00,
        items: ['Americano', 'Sandwich', 'Energy Drink'],
        status: 'Completed',
        payment_method: 'Card'
      },
      {
        id: '4',
        date: '2024-09-15',
        amount: 6.50,
        items: ['Green Tea', 'Muffin'],
        status: 'Completed',
        payment_method: 'Card'
      }
    ];
    setRecentTransactions(mockTransactions);
  };

  // Filter drinks based on search and category
  const filteredDrinks = drinks.filter(drink => {
    const matchesSearch = drink.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         drink.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || drink.category === selectedCategory;
    return drink.is_available && matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(drinks.map(drink => drink.category)))];

  const addFavoriteToCart = (drink: Drink) => {
    addToCart(drink);
    toast({
      title: "Favorite Added!",
      description: `${drink.name} added from your favorites`,
      variant: "default",
    });
  };
  const handleLogout = () => {
    console.log('Logging out client...');
    localStorage.removeItem('clientData'); // Fixed: was 'spotinClientData'
    setClientData(null);
    setLoading(false);
    navigate('/client-login');
  };
  const playOrderNotification = () => {
    // Create audio context for notification sound when client orders
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different tone pattern for client orders vs barista quick adds
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.45);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.45);
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
    
    // Play notification sound for new client order
    playOrderNotification();
    
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

  const playOrderSound = () => {
    try {
      const audio = new Audio('/order-sound.wav');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Could not play sound:', err));
    } catch (err) {
      console.log('Audio not supported:', err);
    }
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

    if (!clientData) {
      toast({
        title: "Error",
        description: "Client data not found. Please log in again.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create orders in session_line_items table for barista to see
      for (const item of cart) {
        const { error } = await supabase
          .from('session_line_items')
          .insert({
            user_id: clientData.id,
            item_name: item.name,
            quantity: item.quantity,
            price: item.price,
            status: 'pending'
          });

        if (error) {
          console.error('Error creating order item:', error);
          throw error;
        }
      }

      // Play success sound
      playOrderSound();

      // Show success message
      toast({
        title: "Order Placed Successfully!",
        description: `Your order for $${getCartTotal().toFixed(2)} has been sent to the barista station.`,
        variant: "default"
      });

      // Clear the cart
      setCart([]);

    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
          <MetricCard title="Check-ins (30 days)" value={checkInsLast30Days.toString()} change="Total visits this month" icon={Users} variant="info" />
          <MetricCard title="Check-in Status" value={checkInStatus === 'checked_in' ? 'Checked In' : 'Checked Out'} change={checkInStatus === 'checked_in' ? 'Active session' : 'Not in space'} icon={Clock} variant={checkInStatus === 'checked_in' ? 'success' : 'default'} />
          <MetricCard title="Cart Total" value={cart.length > 0 ? `$${getCartTotal().toFixed(2)}` : '$0.00'} change={cart.length > 0 ? 'Ready to order' : 'Cart is empty'} icon={CreditCard} variant={cart.length > 0 ? 'success' : 'default'} />
          <MetricCard title="Membership Status" value={membershipStatus} change="Enjoy premium benefits" icon={Award} variant={membershipStatus !== 'No active membership' ? 'success' : 'default'} />
        </div>

        {/* Favorite Drinks Section - Show only if no items in cart and have favorites */}
        {cart.length === 0 && favoriteDrinks.length > 0 && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg sm:text-xl">Your Favorite Drinks</CardTitle>
              </div>
              <CardDescription className="text-sm">Quick order from your most ordered drinks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {favoriteDrinks.map(drink => (
                  <div key={drink.id} className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{drink.name}</h4>
                        <Heart className="h-4 w-4 text-red-500 fill-current" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{drink.description}</p>
                      <p className="text-sm font-semibold text-primary">${Number(drink.price).toFixed(2)}</p>
                    </div>
                    <Button onClick={() => addFavoriteToCart(drink)} size="sm" className="shrink-0 ml-2">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs - Mobile Optimized Navigation */}
        <Tabs defaultValue="barcode" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-4 gap-1 min-w-max sm:min-w-0 my-[40px]">
              <TabsTrigger value="barcode" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                My QR Code
              </TabsTrigger>
              <TabsTrigger value="drinks" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                Order Drinks
              </TabsTrigger>
              <TabsTrigger value="account" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                My Account
              </TabsTrigger>
              <TabsTrigger value="receipts" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                My Receipts
              </TabsTrigger>
            </TabsList>
          </div>

          {/* QR Code Tab - Mobile Optimized */}
          <TabsContent value="barcode" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Your Check-in QR Code</CardTitle>
                <CardDescription className="text-sm">
                  Show this QR code to reception staff for quick check-in and check-out
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <BarcodeCard clientCode={clientData.clientCode} barcode={clientData.barcode} userName={clientData.fullName} userEmail={clientData.email} />
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
                   {/* Search and Filter Controls */}
                   <div className="space-y-3">
                     <div className="flex flex-col sm:flex-row gap-3">
                       <div className="relative flex-1">
                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input
                           placeholder="Search drinks..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="pl-10"
                         />
                       </div>
                       <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                         <SelectTrigger className="w-full sm:w-[180px]">
                           <Filter className="h-4 w-4 mr-2" />
                           <SelectValue placeholder="Category" />
                         </SelectTrigger>
                         <SelectContent>
                           {categories.map(category => (
                             <SelectItem key={category} value={category}>
                               {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                       <h3 className="text-base sm:text-lg font-semibold">Available Drinks</h3>
                       <div className="flex gap-2">
                         {favoriteDrinks.length > 0 && (
                           <Badge variant="outline" className="self-start text-red-600 border-red-200">
                             <Heart className="h-3 w-3 mr-1 fill-current" />
                             {favoriteDrinks.length} favorites
                           </Badge>
                         )}
                         <Badge variant="outline" className="self-start">
                           {filteredDrinks.length} available
                         </Badge>
                       </div>
                     </div>
                   </div>
                   
                   <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                     {filteredDrinks.length === 0 ? (
                       <div className="text-center py-8">
                         <Coffee className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                         <p className="text-sm text-muted-foreground">No drinks found</p>
                         <p className="text-xs text-muted-foreground mt-1">
                           {searchQuery ? 'Try adjusting your search or filter' : 'No drinks available in this category'}
                         </p>
                         {(searchQuery || selectedCategory !== 'all') && (
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="mt-3"
                             onClick={() => {
                               setSearchQuery('');
                               setSelectedCategory('all');
                             }}
                           >
                             Clear filters
                           </Button>
                         )}
                       </div>
                     ) : (
                       filteredDrinks.map(drink => {
                         const isFavorite = favoriteDrinks.some(fav => fav.id === drink.id);
                         return (
                           <div key={drink.id} className={`flex items-center justify-between p-3 border rounded-lg ${isFavorite ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' : 'bg-card'}`}>
                             <div className="flex-1 min-w-0 pr-2">
                               <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                 <div className="flex items-center gap-1">
                                   <h4 className="font-medium text-sm truncate">{drink.name}</h4>
                                   {isFavorite && <Heart className="h-3 w-3 text-red-500 fill-current" />}
                                 </div>
                                 <Badge variant="secondary" className="text-xs self-start">{drink.category}</Badge>
                               </div>
                               <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{drink.description}</p>
                               <p className="text-sm font-semibold text-primary">${Number(drink.price).toFixed(2)}</p>
                             </div>
                             <Button onClick={() => addToCart(drink)} size="sm" className="shrink-0 ml-2">
                               <Plus className="h-4 w-4" />
                             </Button>
                           </div>
                         );
                       })
                     )}
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
                        <Button 
                          className="w-full" 
                          size="lg" 
                          onClick={handlePlaceOrder}
                          disabled={loading || cart.length === 0}
                        >
                          <Coffee className="mr-2 h-4 w-4" />
                          {loading ? "Placing Order..." : "Place Order"}
                        </Button>
                      </div>
                    </div>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Account Tab - Mobile Optimized */}
          <TabsContent value="account" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Profile Settings Card */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Profile Settings</CardTitle>
                      <CardDescription className="text-sm">Manage your personal information</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                    >
                      {isEditingProfile ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Photo */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profileData.profileImage} alt={profileData.fullName} />
                        <AvatarFallback className="text-lg">
                          {profileData.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {isEditingProfile && (
                        <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                          <Camera className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <Badge variant="secondary">{membershipStatus}</Badge>
                  </div>

                  {/* Profile Form */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      {isEditingProfile ? (
                        <Input
                          id="fullName"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        />
                      ) : (
                        <p className="text-base font-medium">{profileData.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      {isEditingProfile ? (
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        />
                      ) : (
                        <p className="text-base break-all">{profileData.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      {isEditingProfile ? (
                        <Input
                          id="phone"
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        />
                      ) : (
                        <p className="text-base">{profileData.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      {isEditingProfile ? (
                        <Input
                          id="jobTitle"
                          value={profileData.jobTitle}
                          onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                        />
                      ) : (
                        <p className="text-base">{profileData.jobTitle}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Member ID</Label>
                      <p className="text-base font-mono text-muted-foreground">{clientData?.clientCode}</p>
                    </div>

                    {isEditingProfile && (
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleProfileSave} className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileData({
                              fullName: clientData?.fullName || '',
                              email: clientData?.email || '',
                              phone: clientData?.phone || '',
                              jobTitle: clientData?.jobTitle || '',
                              profileImage: profileData.profileImage
                            });
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Membership & Activity Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl">Membership & Activity</CardTitle>
                  <CardDescription className="text-sm">Your membership status and recent activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Plan</Label>
                      <Badge variant={membershipStatus !== 'No active membership' ? 'default' : 'secondary'} className="self-start">
                        {membershipStatus}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label>Check-ins This Month</Label>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-primary">{checkInsLast30Days}</div>
                        <span className="text-sm text-muted-foreground">visits</span>
                      </div>
                    </div>


                    <div className="space-y-2">
                      <Label>Current Status</Label>
                      <Badge variant={checkInStatus === 'checked_in' ? 'default' : 'secondary'}>
                        {checkInStatus === 'checked_in' ? 'Checked In' : 'Checked Out'}
                      </Badge>
                    </div>
                  </div>

                  {membershipStatus !== 'No active membership' && (
                    <div className="border-t pt-4">
                      <Label className="mb-3 block">Membership Benefits</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0"></div>
                          <span>Priority booking access</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0"></div>
                          <span>Premium workspace access</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0"></div>
                          <span>Exclusive discounts</span>
                        </div>
                      </div>
                    </div>
                  )}
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
                
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-1">No recent transactions found</p>
                    <p className="text-xs text-muted-foreground">
                      Your purchase history will appear here after you place orders
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <Card key={transaction.id} className="p-4 border bg-card">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-sm">Transaction #{transaction.id}</h4>
                              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                {transaction.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {new Date(transaction.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.items.join(', ')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-lg text-primary">
                              ${transaction.amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.payment_method}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Download className="h-3 w-3 mr-2" />
                            Download Receipt
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <FileText className="h-3 w-3 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}