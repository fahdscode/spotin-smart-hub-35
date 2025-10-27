import { useState, useEffect } from "react";
import { Search, Filter, MoreHorizontal, User, Phone, Mail, Briefcase, CheckCircle, XCircle, Edit, Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Receipt from "@/components/Receipt";
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
}

const ClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCheckoutConfirmation, setShowCheckoutConfirmation] = useState(false);
  const [pendingCheckoutClient, setPendingCheckoutClient] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      // If checking out, show confirmation first
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

        // Check if client has an active membership
        const { data: membership } = await supabase
          .from('client_memberships')
          .select('*')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .maybeSingle();

        // Fetch orders ONLY from the current session (between check-in and now)
        let receiptItems: any[] = [];
        
        if (checkInTime) {
          // Only fetch orders created after the check-in time
          const { data: orders } = await supabase
            .from('session_line_items')
            .select('*')
            .eq('user_id', clientId)
            .in('status', ['pending', 'completed', 'served', 'ready'])
            .gte('created_at', checkInTime)
            .lte('created_at', new Date().toISOString())
            .order('created_at', { ascending: true });

          receiptItems = orders?.map(order => ({
            name: order.item_name,
            quantity: order.quantity,
            price: order.price,
            total: order.price * order.quantity
          })) || [];
        }

        const duration = checkInTime 
          ? Math.round((new Date().getTime() - new Date(checkInTime).getTime()) / 60000) 
          : 0;

        // If no membership, add day use ticket
        if (!membership) {
          // Fetch day use ticket price
          const { data: ticketData } = await supabase
            .from('drinks')
            .select('name, price')
            .eq('category', 'day_use_ticket')
            .eq('is_available', true)
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
          } : null
        });

        // Show confirmation dialog
        setShowCheckoutConfirmation(true);
        return;
      }

      // For check-in, proceed directly
      const { error } = await supabase
        .from('clients')
        .update({ active: !currentStatus })
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => prev.map(client => 
        client.id === clientId 
          ? { ...client, active: !currentStatus }
          : client
      ));
      
      const client = clients.find(c => c.id === clientId);
      toast.success(`${client?.full_name} checked in successfully`);
    } catch (error) {
      console.error('Error updating client status:', error);
      toast.error("Failed to update client status");
    }
  };

  const confirmCheckout = async () => {
    if (!pendingCheckoutClient) return;

    try {
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
      setShowReceipt(true);
      
      toast.success(`${client?.full_name} checked out successfully`);
    } catch (error) {
      console.error('Error checking out client:', error);
      toast.error("Failed to checkout client");
    }
  };

  const handlePrint = () => {
    window.print();
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
            <h3 className="font-semibold text-sm">{client.full_name}</h3>
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
          onClick={() => {
            setSelectedClient(client);
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
                              <div>
                                <p className="font-medium text-sm">{client.full_name}</p>
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
                                    onClick={() => {
                                      setSelectedClient(client);
                                      setShowClientDetails(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Client
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={showCheckoutConfirmation} onOpenChange={setShowCheckoutConfirmation}>
        <DialogContent className="max-w-2xl">
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

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-3">
                  <h3 className="font-semibold">Items</h3>
                </div>
                <div className="divide-y">
                  {receiptData.items.map((item: any, index: number) => (
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
                  ))}
                </div>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckoutConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCheckout}>
              Confirm Checkout
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
    </div>
  );
};

export default ClientList;