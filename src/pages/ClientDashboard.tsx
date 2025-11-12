import { useState, useEffect } from 'react';
import FloatingSocialMedia from '@/components/FloatingSocialMedia';
import { useNavigate } from 'react-router-dom';
import { usePreventAccidentalLogout } from '@/hooks/usePreventAccidentalLogout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SpotinHeader from '@/components/SpotinHeader';
import BarcodeCard from '@/components/BarcodeCard';
import ClientEvents from '@/components/ClientEvents';
import SatisfactionPopup from '@/components/SatisfactionPopup';
import { LogoutButton } from '@/components/LogoutButton';
import { ClientOrderHistory } from '@/components/ClientOrderHistory';
import { ActiveTicketCard } from '@/components/ActiveTicketCard';
import { WelcomeCardSkeleton, StatsCardSkeleton, ActiveTicketSkeleton, OrderCardSkeleton, ProductCardSkeleton } from '@/components/client/DashboardSkeleton';
import { EmptyState } from '@/components/client/EmptyStates';
import { Coffee, Clock, Star, Plus, Minus, Search, RotateCcw, ShoppingCart, Heart, User, Receipt, QrCode, Calendar, BarChart3, MapPin, Package, Mail, Phone, LogOut, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useLocalizedFields } from '@/hooks/useLocalizedFields';
import { formatCurrency } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';
import * as ClientSound from '@/lib/clientSounds';

// Remove this interface as we'll use the one from AuthContext

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
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
  const {
    toast
  } = useToast();
  const {
    clientData,
    isAuthenticated,
    userRole,
    clearClientAuth,
    isLoading: authLoading
  } = useAuth();
  const {
    t,
    i18n
  } = useTranslation();
  const {
    isArabic,
    getProductName,
    getProductDescription
  } = useLocalizedFields();

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    if (isArabic) {
      document.documentElement.classList.add('font-cairo');
    } else {
      document.documentElement.classList.remove('font-cairo');
    }
  }, [isArabic, i18n.language]);

  // Prevent accidental logout from back/refresh buttons
  usePreventAccidentalLogout();

  // Core state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'order' | 'profile' | 'events'>('home');
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [tableNumber, setTableNumber] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});

  // Order data
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [lastOrders, setLastOrders] = useState<LastOrder[]>([]);
  const [favoriteDrinks, setFavoriteDrinks] = useState<Drink[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Drink[]>([]);
  const [categories, setCategories] = useState<Array<{
    id: string;
    name: string;
    count: number;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Profile data
  const [checkInsLast30Days, setCheckInsLast30Days] = useState<number>(0);
  const [membershipStatus, setMembershipStatus] = useState<string>('No active membership');
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [lastTableNumber, setLastTableNumber] = useState<string>('');

  // Analytics data
  const [lastVisitDate, setLastVisitDate] = useState<string | null>(null);
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [favoriteTimeSlot, setFavoriteTimeSlot] = useState<string>('Morning');

  // Satisfaction popup
  const [showSatisfactionPopup, setShowSatisfactionPopup] = useState<boolean>(false);

  // Listen for profile navigation event
  useEffect(() => {
    const handleNavigateToProfile = () => {
      setCurrentView('profile');
    };
    window.addEventListener('navigate-to-profile', handleNavigateToProfile);
    return () => window.removeEventListener('navigate-to-profile', handleNavigateToProfile);
  }, []);
  useEffect(() => {
    // Wait for auth to fully load before making navigation decisions
    if (authLoading) {
      return;
    }

    // ProtectedRoute already handles auth, this is just for data fetching
    if (!isAuthenticated || userRole !== 'client') {
      setLoading(false);
      return;
    }
    if (clientData?.id) {
      setLoading(false);
      setDataLoading(true);
      
      // Fetch all data concurrently
      Promise.all([
        fetchAllData(clientData.id),
        fetchCheckInStatus(clientData.id),
        fetchLastTableNumber(clientData.id)
      ]).finally(() => {
        setDataLoading(false);
      });

      // Set up real-time subscription for client status updates
      const clientChannel = supabase.channel('client-status-changes').on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'clients',
        filter: `id=eq.${clientData.id}`
      }, payload => {
        console.log('🔄 Real-time client status update:', payload);
        const newStatus = payload.new.active;
        const oldStatus = payload.old?.active;

        // Show satisfaction popup when client checks out
        if (oldStatus === true && newStatus === false) {
          setShowSatisfactionPopup(true);
        }
        fetchCheckInStatus(clientData.id);
      }).on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'check_ins',
        filter: `client_id=eq.${clientData.id}`
      }, payload => {
        console.log('🔄 Real-time check-in update:', payload);
        fetchCheckInStatus(clientData.id);
      }).subscribe();

      // Set up real-time subscription for order updates
      const ordersChannel = supabase.channel('client-orders-changes').on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'session_line_items',
        filter: `user_id=eq.${clientData.id}`
      }, payload => {
        console.log('🔄 Real-time order update:', payload);
        fetchPendingOrders();
      }).subscribe();

      // Cleanup subscriptions on unmount
      return () => {
        supabase.removeChannel(clientChannel);
        supabase.removeChannel(ordersChannel);
      };
    }
  }, [isAuthenticated, userRole, clientData, navigate]);
  const fetchAllData = async (clientId: string) => {
    try {
      // Fetch all data concurrently for better performance
      const [
        drinksData,
        lastOrdersData
      ] = await Promise.all([
        supabase.from('drinks').select('*').eq('is_available', true).order('category'),
        supabase.rpc('get_client_last_orders', {
          p_user_id: clientId,
          p_limit: 3
        })
      ]);

      if (drinksData.data) {
        const availableDrinks = drinksData.data.filter(d => d.category !== 'day_use_ticket');
        setDrinks(availableDrinks);
        
        // Load additional data based on drinks
        await Promise.all([
          loadFavoritesFromOrders(clientId, availableDrinks),
          loadBestSellingProducts(availableDrinks)
        ]);
        loadCategories(availableDrinks);
      }

      if (lastOrdersData.data && Array.isArray(lastOrdersData.data)) {
        setLastOrders(lastOrdersData.data as unknown as LastOrder[]);
      }

      // Fetch remaining data concurrently
      await Promise.all([
        fetchPendingOrders(clientId),
        fetchCheckInsLast30Days(clientId),
        fetchMembershipStatus(clientId),
        fetchClientAnalytics(clientId),
        fetchRecentTransactions(clientId)
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  const fetchPendingOrders = async (clientId?: string) => {
    if (!clientId && !clientData?.id) return;
    const userId = clientId || clientData?.id;
    try {
      const {
        data,
        error
      } = await supabase.from('session_line_items').select('*').eq('user_id', userId).in('status', ['pending', 'preparing']).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching pending orders:', error);
        return;
      }
      setPendingOrders(data || []);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };
  const loadFavoritesFromOrders = async (clientId: string, availableDrinks: Drink[]) => {
    try {
      // Get order history to find most frequently ordered items
      const {
        data: orders
      } = await supabase.from('session_line_items').select('item_name, quantity').eq('user_id', clientId).in('status', ['completed', 'served']);
      if (orders && orders.length > 0) {
        // Count frequency of each item
        const itemFrequency = orders.reduce((acc: Record<string, number>, order) => {
          const itemName = order.item_name;
          acc[itemName] = (acc[itemName] || 0) + order.quantity;
          return acc;
        }, {});

        // Sort by frequency and get top 3
        const topItems = Object.entries(itemFrequency).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 3).map(([name]) => name);

        // Match with available drinks
        const favorites = availableDrinks.filter(drink => topItems.includes(drink.name));
        setFavoriteDrinks(favorites);
      } else {
        setFavoriteDrinks([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavoriteDrinks([]);
    }
  };
  const loadBestSellingProducts = async (availableDrinks: Drink[]) => {
    try {
      // Get all completed/served orders to find best sellers
      const {
        data: orders
      } = await supabase.from('session_line_items').select('item_name, quantity').in('status', ['completed', 'served']);
      if (orders && orders.length > 0) {
        // Count total quantity sold for each item
        const itemSales = orders.reduce((acc: Record<string, number>, order) => {
          const itemName = order.item_name;
          acc[itemName] = (acc[itemName] || 0) + order.quantity;
          return acc;
        }, {});

        // Sort by sales and get top 6
        const topItems = Object.entries(itemSales).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 6).map(([name]) => name);

        // Match with available drinks
        const bestSellers = availableDrinks.filter(drink => topItems.includes(drink.name));
        setBestSellingProducts(bestSellers);
      } else {
        // If no orders, show random products
        const randomProducts = availableDrinks.sort(() => 0.5 - Math.random()).slice(0, 6);
        setBestSellingProducts(randomProducts);
      }
    } catch (error) {
      console.error('Error loading best sellers:', error);
      setBestSellingProducts([]);
    }
  };
  const loadCategories = (availableDrinks: Drink[]) => {
    // Group drinks by category and count
    const categoryMap = availableDrinks.reduce((acc: Record<string, number>, drink) => {
      const category = drink.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Convert to array and sort by count
    const categoryArray = Object.entries(categoryMap).map(([name, count]) => ({
      id: name,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: count as number
    })).sort((a, b) => b.count - a.count);
    setCategories(categoryArray);
  };
  const fetchCheckInsLast30Days = async (clientId: string) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Query check_ins table and count distinct check-in sessions
      // Each check-in creates a new record, so we count all records in the last 30 days
      const { data, error } = await supabase
        .from('check_ins')
        .select('id, checked_in_at')
        .eq('client_id', clientId)
        .gte('checked_in_at', thirtyDaysAgo.toISOString())
        .order('checked_in_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching check-ins last 30 days:', error);
        setCheckInsLast30Days(0);
        return;
      }
      
      // Count total check-in records (each represents a visit)
      setCheckInsLast30Days(data?.length || 0);
    } catch (error) {
      console.error('Exception fetching check-ins:', error);
      setCheckInsLast30Days(0);
    }
  };
  const fetchMembershipStatus = async (clientId: string) => {
    try {
      const {
        data
      } = await supabase.from('client_memberships').select('plan_name, is_active').eq('client_id', clientId).eq('is_active', true).maybeSingle();
      setMembershipStatus(data?.plan_name || 'No active membership');
    } catch (error) {
      setMembershipStatus('No active membership');
    }
  };
  const fetchCheckInStatus = async (clientId: string) => {
    try {
      console.log('🔍 Fetching check-in status for client:', clientId);
      
      // Use RPC function to bypass RLS issues with custom client auth
      const { data, error } = await supabase.rpc('get_client_check_in_status', {
        p_client_id: clientId
      });
      
      if (error) {
        console.error('❌ Error fetching check-in status:', error);
        setIsCheckedIn(false);
        setCheckInTime(null);
        return;
      }
      
      // RPC returns an array, get first result
      const statusResult = data?.[0];
      console.log('📊 Client status from RPC:', statusResult);
      
      if (statusResult?.active === true) {
        setIsCheckedIn(true);
        const checkInTime = statusResult.check_in_time || statusResult.updated_at;
        setCheckInTime(new Date(checkInTime).toLocaleTimeString());
        console.log('✅ Client is checked in at:', checkInTime);
      } else {
        setIsCheckedIn(false);
        setCheckInTime(null);
        console.log('❌ Client is not checked in');
      }
    } catch (error) {
      console.error('💥 Error in fetchCheckInStatus:', error);
      setIsCheckedIn(false);
      setCheckInTime(null);
    }
  };
  const fetchClientAnalytics = async (clientId: string) => {
    try {
      // Fetch last visit (last check-out)
      const {
        data: lastCheckOut
      } = await supabase.from('check_in_logs').select('timestamp').eq('client_id', clientId).eq('action', 'checked_out').order('timestamp', {
        ascending: false
      }).limit(1).maybeSingle();
      if (lastCheckOut) {
        setLastVisitDate(new Date(lastCheckOut.timestamp).toLocaleDateString());
      }

      // Fetch total visits count
      const {
        data: allCheckIns
      } = await supabase.from('check_in_logs').select('timestamp').eq('client_id', clientId).eq('action', 'checked_in');
      setTotalVisits(allCheckIns?.length || 0);

      // Analyze favorite time slot based on check-ins
      if (allCheckIns && allCheckIns.length > 0) {
        const timeSlots = {
          Morning: 0,
          Afternoon: 0,
          Evening: 0
        };
        allCheckIns.forEach(checkIn => {
          const hour = new Date(checkIn.timestamp).getHours();
          if (hour < 12) timeSlots.Morning++;else if (hour < 18) timeSlots.Afternoon++;else timeSlots.Evening++;
        });
        const favoriteSlot = Object.entries(timeSlots).reduce((a, b) => timeSlots[a[0]] > timeSlots[b[0]] ? a : b)[0];
        setFavoriteTimeSlot(favoriteSlot);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };
  const fetchRecentTransactions = async (clientId: string) => {
    try {
      // Fetch real transaction data from receipts
      const { data: receiptsData, error } = await supabase
        .from('receipts')
        .select('id, receipt_date, total_amount, line_items, payment_method, status')
        .eq('user_id', clientId)
        .eq('status', 'completed')
        .order('receipt_date', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching transactions:', error);
        setRecentTransactions([]);
        return;
      }

      if (receiptsData && receiptsData.length > 0) {
        const transactions = receiptsData.map(receipt => ({
          id: receipt.id,
          date: new Date(receipt.receipt_date).toLocaleDateString(),
          amount: receipt.total_amount,
          items: Array.isArray(receipt.line_items) 
            ? receipt.line_items.map((item: any) => item.name || item.item_name).filter(Boolean)
            : [],
          status: 'Completed',
          payment_method: receipt.payment_method.charAt(0).toUpperCase() + receipt.payment_method.slice(1)
        }));
        setRecentTransactions(transactions);
      } else {
        setRecentTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setRecentTransactions([]);
    }
  };
  const fetchLastTableNumber = async (clientId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('clients').select('last_table_number').eq('id', clientId).maybeSingle();
      if (error) throw error;
      if (data?.last_table_number) {
        setLastTableNumber(data.last_table_number);
        setTableNumber(data.last_table_number);
      }
    } catch (error) {
      console.error('Error fetching last table number:', error);
    }
  };
  const addToCart = (drink: Drink, goToCart = false) => {
    if (!isCheckedIn) {
      ClientSound.playError();
      toast({
        title: "Check-in Required",
        description: "Please check in at reception before placing orders.",
        variant: "destructive"
      });
      return;
    }
    
    ClientSound.playItemAdded();
    const existingItem = cart.find(item => item.id === drink.id);
    if (existingItem) {
      setCart(cart.map(item => item.id === drink.id ? {
        ...item,
        quantity: item.quantity + 1,
        name: getProductName(drink)
      } : item));
    } else {
      setCart([...cart, {
        id: drink.id,
        name: getProductName(drink),
        price: drink.price,
        quantity: 1,
        note: orderNotes[drink.id] || ''
      }]);
    }
    toast({
      title: t('clientDashboard.addedToCart'),
      description: `${getProductName(drink)} ${t('clientDashboard.addedToOrder')}`
    });
    if (goToCart) {
      setCurrentView('order');
    }
  };
  const updateItemNote = (itemId: string, note: string) => {
    setCart(cart.map(item => item.id === itemId ? {
      ...item,
      note
    } : item));
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
      const drink = drinks.find(d => getProductName(d) === item.item_name && d.is_available);
      if (drink) {
        newCartItems.push({
          id: drink.id,
          name: getProductName(drink),
          price: drink.price,
          quantity: item.quantity
        });
      }
    });
    setCart(newCartItems);
    setCurrentView('order');
    toast({
      title: "Order Added!",
      description: `${newCartItems.length} items from your last order added to cart`
    });
  };
  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.id !== itemId));
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
  const handlePlaceOrder = async () => {
    if (!isCheckedIn) {
      ClientSound.playError();
      toast({
        title: "Check-in Required",
        description: "Please check in at reception before placing orders.",
        variant: "destructive"
      });
      return;
    }
    if (cart.length === 0) {
      ClientSound.playError();
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order.",
        variant: "destructive"
      });
      return;
    }
    if (!tableNumber.trim()) {
      ClientSound.playError();
      toast({
        title: "Table Number Required",
        description: "Please enter your table number before placing an order.",
        variant: "destructive"
      });
      return;
    }
    if (!clientData?.id) {
      ClientSound.playError();
      toast({
        title: "Authentication Error",
        description: "Client information not found. Please try logging in again.",
        variant: "destructive"
      });
      return;
    }
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

      // Prepare order items for RPC function
      const orderItems = validatedItems.map(item => ({
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.note?.trim() || null,
        table_number: tableNumber.trim()
      }));

      // Use RPC function to bypass RLS issues
      const { data, error } = await supabase.rpc('create_client_order', {
        p_client_id: clientData.id,
        p_items: orderItems
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string };
      if (!result?.success) {
        throw new Error(result?.message || 'Failed to place order');
      }

      // Update client's last table number
      if (clientData?.id && tableNumber.trim()) {
        await supabase.from('clients').update({
          last_table_number: tableNumber.trim()
        }).eq('id', clientData.id);
      }

      ClientSound.playOrderPlaced();
      setCart([]);
      setTableNumber('');
      setOrderNotes({});
      setCurrentView('home');
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been sent to the barista. Payment will be collected at checkout."
      });
      await fetchPendingOrders();
    } catch (error) {
      console.error('Error placing order:', error);
      ClientSound.playError();
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Could not place order. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleCancelOrder = async (orderId: string) => {
    try {
      const {
        data: orderToCancel
      } = await supabase.from('session_line_items').select('*').eq('id', orderId).eq('status', 'pending').single();
      if (!orderToCancel) {
        toast({
          title: "Cannot Cancel",
          description: "Order cannot be cancelled at this time",
          variant: "destructive"
        });
        return;
      }
      const {
        error
      } = await supabase.from('session_line_items').update({
        status: 'cancelled'
      }).eq('id', orderId);
      if (error) throw error;
      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled"
      });
      await fetchPendingOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive"
      });
    }
  };
  const filteredDrinks = drinks.filter(drink => {
    const productName = getProductName(drink).toLowerCase();
    const productDesc = getProductDescription(drink)?.toLowerCase() || '';
    const matchesSearch = productName.includes(searchQuery.toLowerCase()) || productDesc.includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || drink.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const handleLogout = async () => {
    try {
      await clearClientAuth();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully"
      });
      navigate('/client-login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out properly",
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <SpotinHeader />
      
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          <Button variant={currentView === 'home' ? 'default' : 'ghost'} size="sm" onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          ClientSound.playTap();
          setCurrentView('home');
        }} className="flex flex-col items-center gap-1 h-auto py-2 transition-transform active:scale-95" type="button">
            <Coffee className="h-4 w-4" />
            <span className="text-xs">{t('clientDashboard.home')}</span>
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={currentView === 'order' ? 'default' : 'ghost'} size="sm" onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isCheckedIn) {
                    ClientSound.playTap();
                    setCurrentView('order');
                  } else {
                    ClientSound.playError();
                    toast({
                      title: "Check-in Required",
                      description: "Please check in at reception before placing orders.",
                      variant: "destructive"
                    });
                  }
                }} className="flex flex-col items-center gap-1 h-auto py-2 relative transition-transform active:scale-95" disabled={!isCheckedIn} type="button">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-xs">{t('clientDashboard.order')}</span>
                  {!isCheckedIn && <Info className="h-3 w-3 absolute -top-1 -right-1 text-destructive" />}
                  {cart.length > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse">
                      {cart.length}
                    </Badge>}
                </Button>
              </TooltipTrigger>
              {!isCheckedIn && (
                <TooltipContent>
                  <p>Check in at reception to order</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <Button variant={currentView === 'events' ? 'default' : 'ghost'} size="sm" onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          ClientSound.playTap();
          setCurrentView('events');
        }} className="flex flex-col items-center gap-1 h-auto py-2 transition-transform active:scale-95" type="button">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">{t('clientDashboard.events')}</span>
          </Button>
          <Button variant={currentView === 'profile' ? 'default' : 'ghost'} size="sm" onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          ClientSound.playTap();
          setCurrentView('profile');
        }} className="flex flex-col items-center gap-1 h-auto py-2 transition-transform active:scale-95" type="button">
            <User className="h-4 w-4" />
            <span className="text-xs">{t('clientDashboard.profile')}</span>
          </Button>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex justify-center py-4 border-b border-border">
        <div className="flex gap-2">
          <Button variant={currentView === 'home' ? 'default' : 'outline'} onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setCurrentView('home');
        }} type="button">
            <Coffee className="h-4 w-4 mr-2" />
            {t('dashboard.quickActions')}
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={currentView === 'order' ? 'default' : 'outline'} onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isCheckedIn) {
                    setCurrentView('order');
                  } else {
                    toast({
                      title: "Check-in Required",
                      description: "Please check in at reception before placing orders.",
                      variant: "destructive"
                    });
                  }
                }} className="relative" disabled={!isCheckedIn} type="button">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t('clientDashboard.orderDrinks')}
                  {!isCheckedIn && <Info className="h-4 w-4 ml-2 text-destructive" />}
                  {cart.length > 0 && <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {cart.length}
                    </Badge>}
                </Button>
              </TooltipTrigger>
              {!isCheckedIn && (
                <TooltipContent>
                  <p>Check in at reception to order</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <Button variant={currentView === 'events' ? 'default' : 'outline'} onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setCurrentView('events');
        }} type="button">
            <Calendar className="h-4 w-4 mr-2" />
            {t('clientDashboard.viewEvents')}
          </Button>
          <Button variant={currentView === 'profile' ? 'default' : 'outline'} onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setCurrentView('profile');
        }} type="button">
            <User className="h-4 w-4 mr-2" />
            {t('clientDashboard.myProfile')}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Home View */}
        {currentView === 'home' && <div className="space-y-6 animate-fade-in">
            {/* Welcome Section */}
            {dataLoading ? (
              <WelcomeCardSkeleton />
            ) : (
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 transition-transform hover:scale-110 duration-300">
                    <AvatarFallback className="text-lg">
                      {clientData?.full_name?.[0]}{clientData?.full_name?.split(' ')[1]?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold animate-fade-in">{t('clientDashboard.welcomeBack')}, {clientData?.full_name?.split(' ')[0]}! 👋</h1>
                    <p className="text-muted-foreground">{t('clientDashboard.quickOrder')}</p>
                    <Badge variant="secondary" className="mt-2 animate-scale-in">
                      {membershipStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Client Status & Quick Stats */}
            {dataLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={isCheckedIn ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"}>
                <CardContent className="pt-6 text-center">
                  <div className={`h-8 w-8 mx-auto mb-2 ${isCheckedIn ? 'text-success' : 'text-destructive'}`}>
                    {isCheckedIn ? <div className="h-8 w-8 bg-success rounded-full flex items-center justify-center">
                        <div className="h-4 w-4 bg-white rounded-full"></div>
                      </div> : <div className="h-8 w-8 bg-destructive rounded-full flex items-center justify-center">
                        <div className="h-4 w-4 bg-white rounded-full"></div>
                      </div>}
                  </div>
                  <div className={`text-lg font-bold ${isCheckedIn ? 'text-success' : 'text-destructive'}`}>
                    {isCheckedIn ? t('clientDashboard.checkedIn') : t('clientDashboard.notCheckedIn')}
                  </div>
                  {isCheckedIn && checkInTime && <p className="text-sm text-success">{t('clientDashboard.checkedInAt')} {checkInTime}</p>}
                  {!isCheckedIn && <p className="text-sm text-muted-foreground mt-2">{t('clientDashboard.checkIn')}</p>}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{checkInsLast30Days}</div>
                  <p className="text-sm text-muted-foreground">{t('clientDashboard.checkInsLast30Days')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">
                    {formatCurrency(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('clientDashboard.cart')} ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                  </p>
                </CardContent>
              </Card>
            </div>
            )}

            {/* Active Ticket Card */}
            {dataLoading && isCheckedIn ? (
              <ActiveTicketSkeleton />
            ) : (
              isCheckedIn && clientData?.id && <ActiveTicketCard clientId={clientData.id} />
            )}

            {/* Quick Actions */}
            <div className="space-y-4">
              {!isCheckedIn && <Card className="border-accent/20 bg-accent/5">
                  
                </Card>}

              {dataLoading ? (
                <OrderCardSkeleton />
              ) : isCheckedIn && cart.length === 0 && lastOrders.length > 0 ? (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RotateCcw className="h-5 w-5" />
                      {t('clientDashboard.lastOrders')}
                    </CardTitle>
                    <CardDescription>
                      {t('clientDashboard.quickOrder')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lastOrders.slice(0, 2).map((order, index) => <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all">
                        <div>
                          <p className="font-medium">
                            {new Date(order.order_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.total_items} items • {formatCurrency(order.total_price)}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => reorderLastOrder(order)} className="shrink-0" disabled={!isCheckedIn}>
                          <Plus className="h-4 w-4 mr-1" />
                          {t('clientDashboard.reorder')}
                        </Button>
                      </div>)}
                  </CardContent>
                </Card>
              ) : isCheckedIn && cart.length === 0 && lastOrders.length === 0 && !dataLoading ? (
                <EmptyState type="orders" onAction={() => setCurrentView('order')} />
              ) : null}



              {/* Best Selling Products */}
              {dataLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                </div>
              ) : bestSellingProducts.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      {t('clientDashboard.bestSellers')}
                    </CardTitle>
                    <CardDescription>
                      {t('clientDashboard.categories')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {bestSellingProducts.map(drink => <div key={drink.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
                          <div className="flex-1">
                            <p className="font-medium">{getProductName(drink)}</p>
                            <p className="text-sm text-muted-foreground">{getProductDescription(drink)}</p>
                            <p className="text-sm font-semibold text-primary mt-1">{formatCurrency(drink.price)}</p>
                          </div>
                          <Button size="sm" onClick={() => addToCart(drink, false)} disabled={!isCheckedIn} className="transition-transform active:scale-95">
                            <Plus className="h-4 w-4 mr-1" />
                            {t('clientDashboard.addToCart')}
                          </Button>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Favorites */}
              {dataLoading ? (
                <OrderCardSkeleton />
              ) : favoriteDrinks.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      {t('clientDashboard.favorites')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {favoriteDrinks.map(drink => <div key={drink.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium">{getProductName(drink)}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(drink.price)}</p>
                          </div>
                          <Button size="sm" onClick={() => addToCart(drink, true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            {t('clientDashboard.addToCart')}
                          </Button>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>
              ) : !dataLoading ? (
                <EmptyState type="favorites" onAction={() => setCurrentView('order')} />
              ) : null}
            </div>
          </div>}

        {/* Order View */}
        {currentView === 'order' && <div className="space-y-6 animate-fade-in">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder={t('clientDashboard.searchDrinksPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>

            {/* Categories Filter */}
            {categories.length > 0 && <div className="space-y-2">
                <Label className="text-sm font-medium">{t('clientDashboard.categories')}</Label>
                <div className="flex flex-wrap gap-2">
                  <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory('all')} className="rounded-full">
                    {t('clientDashboard.allItems')}
                  </Button>
                  {categories.map(category => <Button key={category.id} variant={selectedCategory === category.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(category.id)} className="rounded-full">
                      {category.name} ({category.count})
                    </Button>)}
                </div>
              </div>}

            {/* Cart Summary */}
            {cart.length > 0 && <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>{t('clientDashboard.yourOrder')} ({cart.length} {t('clientDashboard.items')})</CardTitle>
                  <CardDescription>{t('clientDashboard.total')}: {formatCurrency(getCartTotal())}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Table Number Input */}
                  <div className="space-y-2">
                    <Label htmlFor="tableNumber" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t('clientDashboard.tableNumberRequired')}
                    </Label>
                    <Input id="tableNumber" type="text" placeholder={lastTableNumber ? `${t('clientDashboard.lastUsed')} ${lastTableNumber}` : t('clientDashboard.enterTableNumber')} value={tableNumber} onChange={e => setTableNumber(e.target.value)} className="text-center text-lg font-semibold" required />
                  </div>

                  <div className="space-y-3">
                    {cart.map(item => <div key={item.id} className="space-y-2 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} {t('clientDashboard.eachPrice')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`note-${item.id}`} className="text-xs text-muted-foreground">
                            {t('clientDashboard.specialInstructions')}
                          </Label>
                          <Input id={`note-${item.id}`} type="text" placeholder={t('clientDashboard.specialInstructionsPlaceholder')} value={item.note || ''} onChange={e => updateItemNote(item.id, e.target.value)} className="text-sm" />
                        </div>
                      </div>)}
                  </div>
                  <Button onClick={handlePlaceOrder} className="w-full" size="lg">
                    {t('clientDashboard.placeOrder')} • {formatCurrency(getCartTotal())}
                  </Button>
                </CardContent>
              </Card>}

            {/* Current Pending Orders */}
            {dataLoading ? (
              <OrderCardSkeleton />
            ) : pendingOrders.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t('clientDashboard.currentOrders')}</CardTitle>
                  <CardDescription>{t('clientDashboard.ordersBeingPrepared')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingOrders.map(order => <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div>
                        <p className="font-medium">{order.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('clientDashboard.quantity')}: {order.quantity} • {formatCurrency(order.price * order.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={order.status === 'preparing' ? 'default' : 'secondary'}>
                          {t(`clientDashboard.${order.status}`)}
                        </Badge>
                        {order.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => handleCancelOrder(order.id)}>
                            {t('clientDashboard.cancel')}
                          </Button>}
                      </div>
                    </div>)}
                </CardContent>
              </Card>
            ) : !dataLoading && pendingOrders.length === 0 && cart.length === 0 ? (
              <EmptyState type="pending" />
            ) : null}

            {/* Drinks Menu */}
            {dataLoading ? (
              <div className="grid gap-4">
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </div>
            ) : (
            <div className="grid gap-4">
              {filteredDrinks.map(drink => <Card key={drink.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{getProductName(drink)}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{getProductDescription(drink)}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatCurrency(drink.price)}</span>
                          <Badge variant="outline">{drink.category}</Badge>
                        </div>
                      </div>
                      <Button onClick={() => addToCart(drink)} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        {t('clientDashboard.add')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
            )}

            {/* Order History Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('clientDashboard.orderHistory')}</h3>
              <ClientOrderHistory clientId={clientData?.id || ''} />
            </div>
          </div>}

        {/* Profile View */}
        {currentView === 'profile' && <div className="space-y-6 animate-fade-in">
            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t('clientDashboard.profileInformation')}</CardTitle>
                <CardDescription>{t('clientDashboard.yourPersonalDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl">
                      {clientData?.full_name?.[0]}{clientData?.full_name?.split(' ')[1]?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold">{clientData?.full_name}</h3>
                    <p className="text-muted-foreground">{t('clientDashboard.clientMember')}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{clientData?.email || t('clientDashboard.noEmail')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{clientData?.phone || t('clientDashboard.noPhone')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{t('clientDashboard.clientCode')}: {clientData?.client_code}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">{t('clientDashboard.status')}</Label>
                    <Badge variant={isCheckedIn ? "default" : "secondary"} className="w-full justify-center py-2">
                      {isCheckedIn ? t('clientDashboard.checkedIn') : t('clientDashboard.checkOut')}
                      {isCheckedIn && checkInTime && ` - ${checkInTime}`}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">{t('clientDashboard.membership')}</Label>
                    <Badge variant="outline" className="w-full justify-center py-2">
                      {membershipStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code - Always show in profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  {t('clientDashboard.yourQRCode')}
                </CardTitle>
                <CardDescription>
                  {t('clientDashboard.showToReception')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BarcodeCard barcode={clientData?.client_code || ''} userName={clientData?.full_name || ''} userEmail={clientData?.email || ''} clientCode={clientData?.client_code || ''} compact={true} />
              </CardContent>
            </Card>

            {/* Visit Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t('clientDashboard.visitAnalytics')}
                </CardTitle>
                <CardDescription>{t('clientDashboard.yourActivity')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">{totalVisits}</div>
                    <div className="text-sm text-muted-foreground">{t('clientDashboard.totalVisitsCount')}</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">{checkInsLast30Days}</div>
                    <div className="text-sm text-muted-foreground">{t('clientDashboard.last30Days')}</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">{favoriteTimeSlot}</div>
                    <div className="text-sm text-muted-foreground">{t('clientDashboard.favoriteTimeSlot')}</div>
                  </div>
                </div>
                {lastVisitDate && <div className="mt-4 p-3 rounded-lg bg-accent/50 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {t('clientDashboard.lastVisitDate')} <span className="font-medium">{lastVisitDate}</span>
                    </span>
                  </div>}
              </CardContent>
            </Card>

            {/* Current Receipt */}
            {cart.length > 0 && <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    {t('clientDashboard.currentOrder')}
                  </CardTitle>
                  <CardDescription>{t('clientDashboard.itemsInCart')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cart.map(item => <div key={item.id} className="flex justify-between items-center">
                        <span>{item.name} x {item.quantity}</span>
                        <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </div>)}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-bold">
                        <span>{t('clientDashboard.total')}</span>
                        <span>{formatCurrency(getCartTotal())}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>}

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  {t('clientDashboard.recentOrders')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.map(transaction => <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
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
                    </div>)}
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('clientDashboard.advancedSettings')}
                </CardTitle>
                <CardDescription>{t('clientDashboard.managePreferences')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('clientDashboard.accountInformation')}</Label>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between p-2 rounded bg-muted/50">
                      <span className="text-muted-foreground">{t('clientDashboard.barcode')}</span>
                      <span className="font-medium">{clientData?.barcode}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-muted/50">
                      <span className="text-muted-foreground">{t('clientDashboard.clientId')}</span>
                      <span className="font-mono text-xs">{clientData?.id?.slice(0, 8)}...</span>
                    </div>
                    {lastTableNumber && <div className="flex justify-between p-2 rounded bg-muted/50">
                        <span className="text-muted-foreground">{t('clientDashboard.lastTable')}</span>
                        <span className="font-medium">{t('clientDashboard.table')} {lastTableNumber}</span>
                      </div>}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Label className="mb-3 block">{t('clientDashboard.accountActions')}</Label>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/client-settings')}>
                      <User className="h-4 w-4 mr-2" />
                      {t('clientDashboard.editProfile')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/client-settings')}>
                      <Package className="h-4 w-4 mr-2" />
                      {t('clientDashboard.managePreferencesBtn')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sign Out Button */}
            <Card className="border-destructive/50">
              <CardContent className="pt-6">
                <Button variant="destructive" onClick={handleLogout} className="w-full" size="lg">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('clientDashboard.signOut')}
                </Button>
              </CardContent>
            </Card>
          </div>}

        {/* Events View */}
        {currentView === 'events' && <div className="space-y-6 animate-fade-in">
            <ClientEvents clientData={clientData} />
          </div>}
      </div>

      {/* Satisfaction Popup */}
      <SatisfactionPopup isOpen={showSatisfactionPopup} onClose={() => setShowSatisfactionPopup(false)} clientId={clientData?.id || ''} />

      {/* Floating Social Media */}
      <FloatingSocialMedia />
    </div>;
}