import { useState, useEffect } from "react";
import { Search, Filter, MoreHorizontal, User, Phone, Mail, Briefcase, CheckCircle, XCircle, Edit, Eye, Printer, Ban, Trash2, Plus, ChevronDown, ChevronUp, LogOut, Ticket, CreditCard, Banknote, Building2, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Receipt from "@/components/Receipt";
import { TicketSelector } from "@/components/TicketSelector";
import { formatCurrency } from "@/lib/currency";

interface Client {
  id: string;
  client_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  how_did_you_find_us: string;
  active: boolean;
  is_active: boolean;
  barcode: string;
  created_at: string;
  updated_at: string;
  membership?: {
    plan_name: string;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    discount_percentage: number;
  };
}

const ClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [drinks, setDrinks] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showProductSelector, setShowProductSelector] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCheckoutConfirmation, setShowCheckoutConfirmation] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [checkoutOnCancel, setCheckoutOnCancel] = useState(false);
  const [restockOnCancel, setRestockOnCancel] = useState(false);
  const [pendingCheckoutClient, setPendingCheckoutClient] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [pendingCheckInClient, setPendingCheckInClient] = useState<{ id: string; name: string } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");


  useEffect(() => {
    fetchClients();
    fetchDrinks();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          membership:client_memberships!client_id(
            plan_name,
            start_date,
            end_date,
            is_active,
            discount_percentage
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to handle membership array
      const transformedData = data?.map(client => ({
        ...client,
        membership: Array.isArray(client.membership) && client.membership.length > 0 
          ? client.membership.find((m: any) => m.is_active) 
          : undefined
      })) || [];
      
      setClients(transformedData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrinks = async () => {
    try {
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .eq('is_available', true)
        .neq('category', 'day_use_ticket')
        .order('name');

      if (error) throw error;
      setDrinks(data || []);
    } catch (error) {
      console.error('Error fetching drinks:', error);
    }
  };

  const addItemToCheckout = (drinkId: string) => {
    const drink = drinks.find(d => d.id === drinkId);
    if (!drink || !receiptData) return;

    const newItem = {
      name: drink.name,
      quantity: 1,
      price: drink.price,
      total: drink.price
    };

    const updatedItems = [...receiptData.items, newItem];
    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    
    setReceiptData({
      ...receiptData,
      items: updatedItems,
      subtotal: newSubtotal,
      total: newSubtotal - receiptData.discount
    });

    toast.success(`Added ${drink.name} to checkout`);
  };

  // Get unique categories from drinks
  const categories = ["all", ...Array.from(new Set(drinks.map(d => d.category)))];

  // Filter drinks based on search and category
  const filteredDrinks = drinks.filter(drink => {
    const matchesSearch = drink.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategory === "all" || drink.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      // If checking out, ALWAYS show confirmation first - this is mandatory
      if (currentStatus) {
        setPendingCheckoutClient(clientId);
        
        const client = clients.find(c => c.id === clientId);
        
        // Get current check-in session time first
        const { data: checkInData } = await supabase
          .from('check_ins')
          .select('checked_in_at')
          .eq('client_id', clientId)
          .eq('status', 'checked_in')
          .is('checked_out_at', null)
          .order('checked_in_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const checkInTime = checkInData?.checked_in_at;

        // Determine the time range for orders
        let startTime: string;
        if (checkInTime) {
          startTime = checkInTime;
        } else {
          const { data: clientData } = await supabase
            .from('clients')
            .select('updated_at')
            .eq('id', clientId)
            .single();
          
          startTime = clientData?.updated_at || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        }

        // Check for pending or preparing orders - MUST complete before checkout
        const { data: pendingOrders } = await supabase
          .from('session_line_items')
          .select('*')
          .eq('user_id', clientId)
          .in('status', ['pending', 'preparing'])
          .gte('created_at', startTime)
          .lte('created_at', new Date().toISOString());

        if (pendingOrders && pendingOrders.length > 0) {
          toast.error(`Cannot checkout. ${client?.full_name} has ${pendingOrders.length} pending/preparing order(s). Please complete all orders first.`);
          setPendingCheckoutClient(null);
          return;
        }

        // Check if client has an active membership
        const { data: membership } = await supabase
          .from('client_memberships')
          .select('*')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .maybeSingle();

        // Fetch orders from the current session
        let receiptItems: any[] = [];

        // Only fetch orders created AFTER the current check-in time (not from previous sessions)
        const { data: orders } = await supabase
          .from('session_line_items')
          .select('*')
          .eq('user_id', clientId)
          .in('status', ['completed', 'served', 'ready'])
          .gte('created_at', checkInTime) // Use checkInTime instead of startTime to get only current session
          .lte('created_at', new Date().toISOString())
          .order('created_at', { ascending: true });

        console.log('📦 Orders found for checkout (current session only):', orders);

        receiptItems = orders?.map(order => ({
          name: order.item_name,
          quantity: order.quantity,
          price: order.price,
          total: order.price * order.quantity
        })) || [];

        const duration = checkInTime 
          ? Math.round((new Date().getTime() - new Date(checkInTime).getTime()) / 60000) 
          : 0;

        // Check for assigned ticket in this session (look back a few seconds to account for timing)
        const ticketLookbackTime = new Date(new Date(startTime).getTime() - 10000).toISOString(); // 10 seconds before
        console.log('🎫 Looking for ticket assigned between:', ticketLookbackTime, 'and now');
        const { data: assignedTicket, error: ticketError } = await supabase
          .from('client_tickets')
          .select(`
            *,
            ticket:drinks!client_tickets_ticket_id_fkey(name, price, ticket_type)
          `)
          .eq('client_id', clientId)
          .eq('is_active', true)
          .gte('purchase_date', ticketLookbackTime)
          .order('purchase_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('🎫 Assigned ticket found:', assignedTicket);
        console.log('🎫 Ticket query error:', ticketError);

        // If no membership, add the assigned ticket (or default day use ticket if no ticket assigned)
        if (!membership) {
          if (assignedTicket?.ticket) {
            console.log('✅ Adding assigned ticket to receipt:', assignedTicket.ticket.name);
            // Add the specific ticket that was assigned during check-in
            receiptItems = [
              {
                name: assignedTicket.ticket.name,
                quantity: 1,
                price: assignedTicket.ticket.price,
                total: assignedTicket.ticket.price
              },
              ...receiptItems
            ];
          } else {
            console.log('⚠️ No ticket assigned, using default day use ticket');
            // Fallback: fetch default day use ticket if no ticket was assigned
            const { data: ticketData } = await supabase
              .from('drinks')
              .select('name, price')
              .eq('category', 'day_use_ticket')
              .eq('is_available', true)
              .limit(1)
              .maybeSingle();

            if (ticketData) {
              receiptItems = [
                {
                  name: ticketData.name,
                  quantity: 1,
                  price: ticketData.price,
                  total: ticketData.price
                },
                ...receiptItems
              ];
            }
          }
        }

        // Calculate total from current session orders + ticket (if applicable)
        const orderTotal = receiptItems.reduce((sum, item) => sum + item.total, 0);
        
        // Prepare receipt data
        setReceiptData({
          receiptNumber: `RCP-${Date.now()}`,
          customerName: client?.full_name || 'Client',
          customerEmail: client?.email || '',
          userId: clientId,
          items: receiptItems,
          subtotal: orderTotal,
          discount: 0,
          total: orderTotal,
          paymentMethod: 'Cash',
          date: new Date().toLocaleDateString(),
          checkInTime: checkInTime ? new Date(checkInTime).toLocaleTimeString() : '',
          duration: duration,
          membership: membership ? {
            plan_name: membership.plan_name,
            discount_percentage: membership.discount_percentage
          } : null,
          assignedTicket: assignedTicket?.ticket ? {
            name: assignedTicket.ticket.name,
            price: assignedTicket.ticket.price,
            ticket_type: assignedTicket.ticket.ticket_type
          } : null
        });

        // Reset payment method selection for new checkout
        setSelectedPaymentMethod("");
        
        // MANDATORY: Always show confirmation dialog - no checkout without this
        setShowCheckoutConfirmation(true);
        return;
      }

      // For check-in, check if client has active membership first
      const client = clients.find(c => c.id === clientId);
      
      // Check for active membership
      const { data: activeMembership } = await supabase
        .from('client_memberships')
        .select('plan_name, discount_percentage')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle();

      if (activeMembership) {
        // Client has membership - check in directly without ticket
        const { error } = await supabase
          .from('clients')
          .update({ active: true })
          .eq('id', clientId);

        if (error) {
          console.error('Error checking in client:', error);
          toast.error("Failed to check in client");
          return;
        }

        // Update local state
        setClients(prev => prev.map(c => 
          c.id === clientId 
            ? { ...c, active: true }
            : c
        ));

        toast.success(`${client?.full_name} checked in with ${activeMembership.plan_name} membership`);
        
        // Emit event to refresh active sessions
        window.dispatchEvent(new CustomEvent('client-status-changed'));
      } else {
        // No membership - show ticket selector
        setPendingCheckInClient({
          id: clientId,
          name: client?.full_name || 'Client'
        });
        setShowTicketDialog(true);
      }
    } catch (error) {
      console.error('Error updating client status:', error);
      toast.error("Failed to update client status");
    }
  };

  const confirmCheckout = async () => {
    if (!pendingCheckoutClient || !receiptData) return;

    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      // Only create receipt if there are items or total > 0
      if (receiptData.items.length > 0 || receiptData.total > 0) {
        const { data: savedReceipt, error: receiptError } = await supabase
          .from('receipts')
          .insert({
            receipt_number: receiptData.receiptNumber,
            user_id: receiptData.userId,
            total_amount: receiptData.total,
            amount: receiptData.total,
            payment_method: selectedPaymentMethod,
            transaction_type: 'checkout',
            line_items: receiptData.items,
            status: 'completed'
          })
          .select()
          .single();

        if (receiptError) throw receiptError;

        // Update receipt data with the saved receipt ID
        setReceiptData(prev => ({
          ...prev,
          receiptId: savedReceipt.id
        }));
      }

      // Checkout the client
      const { error } = await supabase
        .from('clients')
        .update({ active: false })
        .eq('id', pendingCheckoutClient);

      if (error) throw error;

      setClients(prev => prev.map(client => 
        client.id === pendingCheckoutClient 
          ? { ...client, active: false }
          : client
      ));
      
      const client = clients.find(c => c.id === pendingCheckoutClient);
      
      setShowCheckoutConfirmation(false);
      
      toast.success(`${client?.full_name || 'Client'} has been checked out successfully`);
      
      // Show receipt if there are items
      if (receiptData && (receiptData.items.length > 0 || receiptData.total > 0)) {
        setShowReceipt(true);
      }
    } catch (error) {
      console.error('Error checking out client:', error);
      toast.error("Failed to checkout client");
    }
  };

  const cancelReceipt = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    try {
      const client = clients.find(c => c.id === pendingCheckoutClient);
      const { data: { user } } = await supabase.auth.getUser();

      // If receipt was already created, cancel it in the database
      if (receiptData?.receiptId) {
        const { error } = await supabase
          .from('receipts')
          .update({
            status: 'cancelled',
            cancellation_reason: cancellationReason,
            cancelled_at: new Date().toISOString(),
            cancelled_by: user?.id
          })
          .eq('id', receiptData.receiptId);

        if (error) throw error;
      } else if (receiptData?.items && receiptData.items.length > 0) {
        // If receipt wasn't created yet but there are items, create a cancelled receipt
        const { error: insertError } = await supabase
          .from('receipts')
          .insert({
            receipt_number: receiptData.receiptNumber,
            user_id: receiptData.userId,
            total_amount: receiptData.total,
            amount: receiptData.subtotal,
            payment_method: receiptData.paymentMethod || 'cash',
            transaction_type: 'sale',
            line_items: receiptData.items,
            status: 'cancelled',
            cancellation_reason: cancellationReason,
            cancelled_at: new Date().toISOString(),
            cancelled_by: user?.id,
            receipt_date: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // If restock option is selected, restock the inventory
      if (restockOnCancel && receiptData?.line_items) {
        try {
          for (const item of receiptData.line_items) {
            // Get product ingredients
            const { data: product } = await supabase
              .from('drinks')
              .select('id')
              .eq('name', item.item_name)
              .single();

            if (product) {
              const { data: ingredients } = await supabase
                .from('product_ingredients')
                .select('stock_id, quantity_needed')
                .eq('product_id', product.id);

              if (ingredients) {
                // Restock each ingredient
                for (const ingredient of ingredients) {
                  const quantityToRestock = ingredient.quantity_needed * item.quantity;
                  
                  // Get current stock quantity
                  const { data: stock } = await supabase
                    .from('stock')
                    .select('current_quantity')
                    .eq('id', ingredient.stock_id)
                    .single();
                  
                  if (stock) {
                    await supabase
                      .from('stock')
                      .update({ current_quantity: stock.current_quantity + quantityToRestock })
                      .eq('id', ingredient.stock_id);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error restocking items:', error);
          toast.error("Receipt cancelled but failed to restock some items");
        }
      }

      // If checkout option is selected, checkout the client
      if (checkoutOnCancel && pendingCheckoutClient) {
        const { error: checkoutError } = await supabase
          .from('clients')
          .update({ active: false })
          .eq('id', pendingCheckoutClient);

        if (checkoutError) {
          console.error('Error checking out client:', checkoutError);
          toast.error("Receipt cancelled but failed to checkout client");
        } else {
          // Update local state
          setClients(prev => prev.map(c => 
            c.id === pendingCheckoutClient 
              ? { ...c, active: false }
              : c
          ));
          
          toast.success(`Receipt cancelled and ${client?.full_name} checked out. Reason: ${cancellationReason}`);
        }
      } else {
        toast.success(`Receipt cancelled for ${client?.full_name}. Reason: ${cancellationReason}`);
      }

      // Close dialogs and reset state
      setShowCancelDialog(false);
      setShowCheckoutConfirmation(false);
      setShowReceipt(false);
      setCancellationReason("");
      setCheckoutOnCancel(false);
      setRestockOnCancel(false);
      setPendingCheckoutClient(null);
      setReceiptData(null);
    } catch (error) {
      console.error('Error cancelling receipt:', error);
      toast.error("Failed to cancel receipt");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEditClient = async () => {
    if (!editingClient) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          first_name: editingClient.first_name,
          last_name: editingClient.last_name,
          full_name: `${editingClient.first_name} ${editingClient.last_name}`,
          email: editingClient.email,
          phone: editingClient.phone,
          job_title: editingClient.job_title,
          how_did_you_find_us: editingClient.how_did_you_find_us
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      setClients(prev => prev.map(client => 
        client.id === editingClient.id ? editingClient : client
      ));

      setShowEditDialog(false);
      setEditingClient(null);
      toast.success("Client updated successfully");
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error("Failed to update client");
    }
  };

  const handleDeleteClient = async () => {
    if (!deletingClient) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', deletingClient.id);

      if (error) throw error;

      setClients(prev => prev.filter(client => client.id !== deletingClient.id));
      setShowDeleteDialog(false);
      setDeletingClient(null);
      toast.success(`${deletingClient.full_name} deleted successfully`);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error("Failed to delete client");
    }
  };

  const handleTicketAssigned = async (ticketData: any) => {
    setShowTicketDialog(false);
    
    if (pendingCheckInClient) {
      // Update client active status
      const { error } = await supabase
        .from('clients')
        .update({ active: true })
        .eq('id', pendingCheckInClient.id);

      if (error) {
        console.error('Error checking in client:', error);
        toast.error("Failed to check in client");
        setPendingCheckInClient(null);
        return;
      }

      // Update local state
      setClients(prev => prev.map(client => 
        client.id === pendingCheckInClient.id 
          ? { ...client, active: true }
          : client
      ));

      toast.success(`${pendingCheckInClient.name} checked in with ${ticketData.ticket_name}`);
      
      // Emit event to refresh active sessions
      window.dispatchEvent(new CustomEvent('client-status-changed'));
    }
    
    setPendingCheckInClient(null);
  };

  const handleSkipTicket = async () => {
    setShowTicketDialog(false);
    
    if (pendingCheckInClient) {
      // Update client active status
      const { error } = await supabase
        .from('clients')
        .update({ active: true })
        .eq('id', pendingCheckInClient.id);

      if (error) {
        console.error('Error checking in client:', error);
        toast.error("Failed to check in client");
        setPendingCheckInClient(null);
        return;
      }

      // Update local state
      setClients(prev => prev.map(client => 
        client.id === pendingCheckInClient.id 
          ? { ...client, active: true }
          : client
      ));

      toast.success(`${pendingCheckInClient.name} checked in successfully`);
      
      // Emit event to refresh active sessions
      window.dispatchEvent(new CustomEvent('client-status-changed'));
    }
    
    setPendingCheckInClient(null);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery) ||
      client.client_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.job_title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && client.active) ||
      (statusFilter === "inactive" && !client.active);

    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  const ClientCard = ({ client }: { client: Client }) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(client.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{client.full_name}</h3>
              {client.membership && (
                <Badge variant="default" className="text-xs">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Member
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{client.client_code}</p>
          </div>
        </div>
        <Badge variant={client.active ? "default" : "secondary"} className="text-xs">
          {client.active ? "Active" : "Inactive"}
        </Badge>
      </div>
      
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Mail className="h-3 w-3" />
          <span>{client.email || 'No email'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3" />
          <span>{client.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Briefcase className="h-3 w-3" />
          <span>{client.job_title}</span>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        <Button
          variant={client.active ? "destructive" : "default"}
          size="sm"
          className="flex-1 text-xs"
          onClick={() => handleToggleClientStatus(client.id, client.active)}
        >
          {client.active ? (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Check Out
            </>
          ) : (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Check In
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            // Fetch membership data
            const { data: membershipData } = await supabase
              .from('client_memberships')
              .select('plan_name, start_date, end_date, is_active, discount_percentage')
              .eq('client_id', client.id)
              .eq('is_active', true)
              .maybeSingle();
            
            setSelectedClient({ ...client, membership: membershipData || undefined });
            setShowClientDetails(true);
          }}
        >
          <Eye className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or client code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>
              Showing {filteredClients.length} of {clients.length} clients
            </span>
            <Badge variant="outline">
              {clients.filter(c => c.active).length} Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(client.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{client.full_name}</p>
                                  {client.membership && (
                                    <Badge variant="default" className="text-xs">
                                      <CreditCard className="h-3 w-3 mr-1" />
                                      Member
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{client.client_code}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm">{client.email}</p>
                              <p className="text-xs text-muted-foreground">{client.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{client.job_title}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={client.active ? "default" : "secondary"}>
                              {client.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{new Date(client.created_at).toLocaleDateString()}</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant={client.active ? "destructive" : "default"}
                                size="sm"
                                onClick={() => handleToggleClientStatus(client.id, client.active)}
                              >
                                {client.active ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Check Out
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Check In
                                  </>
                                )}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      // Fetch membership data
                                      const { data: membershipData } = await supabase
                                        .from('client_memberships')
                                        .select('plan_name, start_date, end_date, is_active, discount_percentage')
                                        .eq('client_id', client.id)
                                        .eq('is_active', true)
                                        .maybeSingle();
                                      
                                      setSelectedClient({ ...client, membership: membershipData || undefined });
                                      setShowClientDetails(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingClient(client);
                                      setShowEditDialog(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Client
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setDeletingClient(client);
                                      setShowDeleteDialog(true);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Client
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {filteredClients.map((client) => (
                      <ClientCard key={client.id} client={client} />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {filteredClients.length === 0 && !loading && (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" 
                      ? "No clients found matching your criteria" 
                      : "No clients registered yet"}
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Ticket Selector Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Assign Ticket
            </DialogTitle>
            <DialogDescription>
              Choose a ticket type for the client or skip to check in without a ticket
            </DialogDescription>
          </DialogHeader>
          {pendingCheckInClient && (
            <TicketSelector
              clientId={pendingCheckInClient.id}
              clientName={pendingCheckInClient.name}
              onTicketAssigned={handleTicketAssigned}
              onCancel={handleSkipTicket}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Client Details Dialog */}
      <Dialog open={showClientDetails} onOpenChange={setShowClientDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(selectedClient.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{selectedClient.full_name}</h2>
                  <p className="text-muted-foreground">{selectedClient.client_code}</p>
                  <Badge variant={selectedClient.active ? "default" : "secondary"} className="mt-2">
                    {selectedClient.active ? "Currently Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedClient.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedClient.phone}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Professional Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedClient.job_title}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">How they found us:</p>
                      <p className="text-sm">{selectedClient.how_did_you_find_us}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Account Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Barcode:</p>
                    <p className="font-mono">{selectedClient.barcode}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Member since:</p>
                    <p>{new Date(selectedClient.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {selectedClient.membership && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Membership Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{selectedClient.membership.plan_name}</span>
                      <Badge variant={selectedClient.membership.is_active ? "default" : "secondary"}>
                        {selectedClient.membership.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-medium">
                          {new Date(selectedClient.membership.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          {selectedClient.membership.end_date ? "Expires" : "Valid Until"}
                        </p>
                        <p className="font-medium">
                          {selectedClient.membership.end_date 
                            ? new Date(selectedClient.membership.end_date).toLocaleDateString()
                            : "Lifetime"}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-semibold text-primary">
                          {selectedClient.membership.discount_percentage}% off
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckoutConfirmation} onOpenChange={setShowCheckoutConfirmation}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Checkout Confirmation</DialogTitle>
            <DialogDescription>
              Review the checkout summary before proceeding
            </DialogDescription>
          </DialogHeader>
          {receiptData && (
            <div className="space-y-6">
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Customer:</span>
                  <span>{receiptData.customerName}</span>
                </div>
                {receiptData.membership && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Membership:</span>
                    <Badge variant="default" className="ml-2">
                      {receiptData.membership.plan_name} ({receiptData.membership.discount_percentage}% discount)
                    </Badge>
                  </div>
                )}
                {receiptData.assignedTicket && (
                  <div className="flex justify-between items-center bg-primary/10 p-3 rounded-md -mx-1">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-semibold">{receiptData.assignedTicket.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{receiptData.assignedTicket.ticket_type?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <span className="font-bold text-primary">{formatCurrency(receiptData.assignedTicket.price)}</span>
                  </div>
                )}
                {receiptData.checkInTime && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Check-in Time:</span>
                    <span>{receiptData.checkInTime}</span>
                  </div>
                )}
                {receiptData.duration > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Duration:</span>
                    <span>{receiptData.duration} minutes</span>
                  </div>
                )}
              </div>

              {/* Add Product Section */}
              <Collapsible open={showProductSelector} onOpenChange={setShowProductSelector}>
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-semibold">Add Items to Checkout</span>
                      </div>
                      {showProductSelector ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="p-4 bg-muted/50 space-y-3">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search products..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Category Filters */}
                      <div className="flex gap-2 flex-wrap">
                        {categories.map((category) => (
                          <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className="capitalize"
                          >
                            {category}
                          </Button>
                        ))}
                      </div>

                      {/* Products Grid */}
                      <ScrollArea className="h-[200px]">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {filteredDrinks.map((drink) => (
                            <Button
                              key={drink.id}
                              variant="outline"
                              size="sm"
                              onClick={() => addItemToCheckout(drink.id)}
                              className="justify-start text-left h-auto py-2"
                            >
                              <div className="truncate w-full">
                                <p className="font-medium text-xs truncate">{drink.name}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(drink.price)}</p>
                              </div>
                            </Button>
                          ))}
                        </div>
                        {filteredDrinks.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            No products found
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-3">
                  <h3 className="font-semibold">Items</h3>
                </div>
                <div className="divide-y">
                  {receiptData.items.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No items yet. Add items above to include them in the checkout.
                    </div>
                  ) : (
                    receiptData.items.map((item: any, index: number) => (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.total)}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="border rounded-lg p-4 space-y-3">
                <Label className="text-base font-semibold">Payment Method *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={selectedPaymentMethod === "visa" ? "default" : "outline"}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setSelectedPaymentMethod("visa")}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Visa</span>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedPaymentMethod === "cash" ? "default" : "outline"}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setSelectedPaymentMethod("cash")}
                  >
                    <Banknote className="h-5 w-5" />
                    <span>Cash</span>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedPaymentMethod === "bank_transfer" ? "default" : "outline"}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setSelectedPaymentMethod("bank_transfer")}
                  >
                    <Building2 className="h-5 w-5" />
                    <span>Bank Transfer</span>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedPaymentMethod === "hot_desk" ? "default" : "outline"}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setSelectedPaymentMethod("hot_desk")}
                  >
                    <Laptop className="h-5 w-5" />
                    <span>Hot Desk</span>
                  </Button>
                </div>
                {!selectedPaymentMethod && (
                  <p className="text-sm text-destructive">Please select a payment method</p>
                )}
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(receiptData.subtotal)}</span>
                  </div>
                  {receiptData.discount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount:</span>
                      <span>-{formatCurrency(receiptData.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(receiptData.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowCheckoutConfirmation(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setShowCancelDialog(true);
              }}
            >
              <Ban className="h-4 w-4 mr-2" />
              Cancel Receipt
            </Button>
            <Button 
              onClick={confirmCheckout}
              disabled={!selectedPaymentMethod}
            >
              Confirm Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Receipt Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Receipt</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this receipt
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">Cancellation Reason</Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Enter reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg border">
              <Checkbox
                id="restock-on-cancel"
                checked={restockOnCancel}
                onCheckedChange={(checked) => setRestockOnCancel(checked as boolean)}
              />
              <div className="flex-1">
                <label
                  htmlFor="restock-on-cancel"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                >
                  <Plus className="h-4 w-4 text-blue-600" />
                  Restock items from this order
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Inventory quantities will be restored for items in this receipt
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg border">
              <Checkbox
                id="checkout-on-cancel"
                checked={checkoutOnCancel}
                onCheckedChange={(checked) => setCheckoutOnCancel(checked as boolean)}
              />
              <div className="flex-1">
                <label
                  htmlFor="checkout-on-cancel"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4 text-destructive" />
                  Also checkout this client
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  The client will be marked as checked out along with the cancelled receipt
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCancelDialog(false);
              setCancellationReason("");
              setCheckoutOnCancel(false);
              setRestockOnCancel(false);
            }}>
              Back
            </Button>
            <Button variant="destructive" onClick={cancelReceipt}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Checkout Receipt</span>
              <Button onClick={handlePrint} size="sm" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </DialogTitle>
          </DialogHeader>
          {receiptData && (
            <Receipt
              receiptNumber={receiptData.receiptNumber}
              customerName={receiptData.customerName}
              customerEmail={receiptData.customerEmail}
              userId={receiptData.userId}
              items={receiptData.items}
              subtotal={receiptData.subtotal}
              discount={receiptData.discount}
              total={receiptData.total}
              paymentMethod={receiptData.paymentMethod}
              date={receiptData.date}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information</DialogDescription>
          </DialogHeader>
          {editingClient && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">First Name</Label>
                <Input
                  id="edit-first-name"
                  value={editingClient.first_name}
                  onChange={(e) => setEditingClient({ ...editingClient, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">Last Name</Label>
                <Input
                  id="edit-last-name"
                  value={editingClient.last_name}
                  onChange={(e) => setEditingClient({ ...editingClient, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editingClient.phone}
                  onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-job-title">Job Title</Label>
                <Input
                  id="edit-job-title"
                  value={editingClient.job_title}
                  onChange={(e) => setEditingClient({ ...editingClient, job_title: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-how-found">How did you find us?</Label>
                <Input
                  id="edit-how-found"
                  value={editingClient.how_did_you_find_us}
                  onChange={(e) => setEditingClient({ ...editingClient, how_did_you_find_us: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditClient}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingClient?.full_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientList;