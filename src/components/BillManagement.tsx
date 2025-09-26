import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, Plus, Edit3, Trash2, Search, Filter, Calendar, DollarSign, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Vendor {
  id: string;
  name: string;
  is_active: boolean;
}

interface Stock {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
}

interface Bill {
  id: string;
  vendor_id: string;
  vendor_name?: string;
  bill_number: string;
  amount: number;
  due_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  line_items?: BillLineItem[];
}

interface BillLineItem {
  id: string;
  bill_id: string;
  stock_id: string;
  stock_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const BillManagement = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stockItems, setStockItems] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [billForm, setBillForm] = useState({
    vendor_id: '',
    bill_number: '',
    due_date: '',
    status: 'pending',
    notes: ''
  });
  const [lineItems, setLineItems] = useState<Omit<BillLineItem, 'id' | 'bill_id'>[]>([]);
  const { toast } = useToast();

  // Mock data
  const mockVendors: Vendor[] = [
    { id: '1', name: 'Fresh Coffee Supplies', is_active: true },
    { id: '2', name: 'Office Equipment Plus', is_active: true },
    { id: '3', name: 'Green Energy Solutions', is_active: false }
  ];

  const mockStock: Stock[] = [
    { id: '1', name: 'Coffee Beans - Arabica', unit: 'kg', cost_per_unit: 15.50 },
    { id: '2', name: 'Milk - Whole', unit: 'liter', cost_per_unit: 2.30 },
    { id: '3', name: 'Sugar - White', unit: 'kg', cost_per_unit: 1.20 },
    { id: '4', name: 'Paper Cups - 12oz', unit: 'piece', cost_per_unit: 0.15 },
    { id: '5', name: 'Cleaning Supplies', unit: 'bottle', cost_per_unit: 8.50 }
  ];

  const mockBills: Bill[] = [
    {
      id: '1',
      vendor_id: '1',
      vendor_name: 'Fresh Coffee Supplies',
      bill_number: 'INV-2024-001',
      amount: 245.50,
      due_date: '2024-10-15',
      status: 'pending',
      notes: 'Monthly coffee supply order',
      created_at: '2024-09-20T10:00:00Z'
    },
    {
      id: '2',
      vendor_id: '2',
      vendor_name: 'Office Equipment Plus',
      bill_number: 'INV-2024-002',
      amount: 89.99,
      due_date: '2024-10-10',
      status: 'paid',
      notes: 'Office supplies and equipment',
      created_at: '2024-09-18T14:30:00Z'
    },
    {
      id: '3',
      vendor_id: '1',
      vendor_name: 'Fresh Coffee Supplies',
      bill_number: 'INV-2024-003',
      amount: 156.75,
      due_date: '2024-09-25',
      status: 'overdue',
      notes: 'Emergency coffee beans order',
      created_at: '2024-09-15T09:15:00Z'
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, name, is_active')
        .eq('is_active', true);

      // Fetch stock items
      const { data: stockData, error: stockError } = await supabase
        .from('stock')
        .select('id, name, unit, cost_per_unit')
        .eq('is_active', true);

      // Fetch bills with vendor names
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select(`
          *,
          vendors!bills_vendor_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      // Use real data if available, otherwise use mock data
      setVendors(vendorsData && vendorsData.length > 0 ? vendorsData : mockVendors);
      setStockItems(stockData && stockData.length > 0 ? stockData : mockStock);
      setBills(billsData && billsData.length > 0 ? 
        billsData.map(bill => ({
          ...bill,
          vendor_name: bill.vendors?.name
        })) : mockBills
      );

    } catch (error) {
      console.error('Error fetching data:', error);
      // Use mock data on error
      setVendors(mockVendors);
      setStockItems(mockStock);
      setBills(mockBills);
      toast({
        title: "Loading Mock Data",
        description: "Using sample bill data for demonstration.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      stock_id: '',
      stock_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }]);
  };

  const updateLineItem = (index: number, field: keyof Omit<BillLineItem, 'id' | 'bill_id'>, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'stock_id') {
      const stock = stockItems.find(s => s.id === value);
      if (stock) {
        updatedItems[index].stock_name = stock.name;
        updatedItems[index].unit_price = stock.cost_per_unit;
        updatedItems[index].total_price = updatedItems[index].quantity * stock.cost_per_unit;
      }
    } else if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }

    setLineItems(updatedItems);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const getTotalAmount = () => {
    return lineItems.reduce((total, item) => total + item.total_price, 0);
  };

  const handleSubmitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const billData = {
        ...billForm,
        amount: getTotalAmount(),
        created_by: 'current_user_id' // In real app, this would be auth.uid()
      };

      let billId: string;

      if (editingBill) {
        // Update existing bill
        const { error } = await supabase
          .from('bills')
          .update(billData)
          .eq('id', editingBill.id);

        if (error) throw error;
        billId = editingBill.id;

        // Delete existing line items
        await supabase
          .from('bill_line_items')
          .delete()
          .eq('bill_id', billId);

        toast({
          title: "Bill Updated",
          description: "Bill has been updated successfully.",
        });
      } else {
        // Create new bill
        const { data, error } = await supabase
          .from('bills')
          .insert(billData)
          .select()
          .single();

        if (error) throw error;
        billId = data.id;

        toast({
          title: "Bill Created",
          description: "New bill has been created successfully.",
        });
      }

      // Insert line items
      if (lineItems.length > 0) {
        const lineItemsData = lineItems.map(item => ({
          bill_id: billId,
          stock_id: item.stock_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        const { error } = await supabase
          .from('bill_line_items')
          .insert(lineItemsData);

        if (error) throw error;
      }

      // Reset form
      setBillForm({
        vendor_id: '',
        bill_number: '',
        due_date: '',
        status: 'pending',
        notes: ''
      });
      setLineItems([]);
      setIsAddingBill(false);
      setEditingBill(null);
      fetchData();
    } catch (error) {
      console.error('Error saving bill:', error);
      toast({
        title: "Error",
        description: "Failed to save bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId);

      if (error) throw error;

      toast({
        title: "Bill Deleted",
        description: "Bill has been removed successfully.",
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: "Error",
        description: "Failed to delete bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bill.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Bill Management
            </CardTitle>
            <CardDescription>
              Manage vendor bills and inventory purchases
            </CardDescription>
          </div>
          <Dialog open={isAddingBill} onOpenChange={setIsAddingBill}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingBill(null);
                setBillForm({
                  vendor_id: '',
                  bill_number: '',
                  due_date: '',
                  status: 'pending',
                  notes: ''
                });
                setLineItems([]);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBill ? 'Edit Bill' : 'Create New Bill'}</DialogTitle>
                <DialogDescription>
                  {editingBill ? 'Update bill information and line items' : 'Create a new bill with line items for inventory purchases'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitBill} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor *</Label>
                    <Select 
                      value={billForm.vendor_id} 
                      onValueChange={(value) => setBillForm({ ...billForm, vendor_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bill_number">Bill Number *</Label>
                    <Input
                      id="bill_number"
                      value={billForm.bill_number}
                      onChange={(e) => setBillForm({ ...billForm, bill_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date *</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={billForm.due_date}
                      onChange={(e) => setBillForm({ ...billForm, due_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={billForm.status} 
                      onValueChange={(value) => setBillForm({ ...billForm, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={billForm.notes}
                    onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Line Items</h3>
                    <Button type="button" variant="outline" onClick={addLineItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  
                  {lineItems.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Stock Item</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lineItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Select 
                                  value={item.stock_id} 
                                  onValueChange={(value) => updateLineItem(index, 'stock_id', value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select stock item" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {stockItems.map(stock => (
                                      <SelectItem key={stock.id} value={stock.id}>
                                        {stock.name} ({stock.unit})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  step="0.01"
                                  value={item.quantity}
                                  onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                {item.total_price.toFixed(2)} EGP
                              </TableCell>
                              <TableCell>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => removeLineItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {lineItems.length > 0 && (
                    <div className="flex justify-end">
                      <div className="text-lg font-semibold">
                        Total: {getTotalAmount().toFixed(2)} EGP
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingBill ? 'Update' : 'Create'} Bill
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddingBill(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Bills</p>
                <p className="text-2xl font-bold">{bills.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">{bills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)} EGP</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue Bills</p>
                <p className="text-2xl font-bold">{bills.filter(bill => bill.status === 'overdue').length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Bills List */}
        <div className="space-y-4">
          {filteredBills.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No bills found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filter' : 'Create your first bill to get started'}
              </p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <Card key={bill.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{bill.bill_number}</h3>
                      <Badge variant={getStatusColor(bill.status)}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{bill.vendor_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {new Date(bill.due_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">{bill.amount.toFixed(2)} EGP</span>
                      </div>
                      {bill.notes && (
                        <p className="text-xs">{bill.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteBill(bill.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BillManagement;