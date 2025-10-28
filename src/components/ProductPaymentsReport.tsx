import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Search, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from 'react-i18next';

interface ProductPayment {
  id: string;
  receipt_number: string;
  receipt_date: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  payment_method: string;
  transaction_type: string;
  customer_name?: string;
}

export const ProductPaymentsReport = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [payments, setPayments] = useState<ProductPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<ProductPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchPayments();
  }, [dateRange]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, paymentMethodFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const { data: receipts, error } = await supabase
        .from('receipts')
        .select('*')
        .gte('receipt_date', startDate.toISOString())
        .order('receipt_date', { ascending: false });

      if (error) throw error;

      // Parse line items from receipts
      const allPayments: ProductPayment[] = [];
      
      receipts?.forEach((receipt) => {
        const lineItems = receipt.line_items as any[];
        lineItems?.forEach((item) => {
          allPayments.push({
            id: `${receipt.id}-${item.item_name}`,
            receipt_number: receipt.receipt_number,
            receipt_date: receipt.receipt_date,
            product_name: item.item_name || item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total: item.total,
            payment_method: receipt.payment_method,
            transaction_type: receipt.transaction_type,
          });
        });
      });

      setPayments(allPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter((p) => p.payment_method === paymentMethodFilter);
    }

    setFilteredPayments(filtered);
  };

  const exportToCSV = () => {
    try {
      const headers = ['Receipt #', 'Date', 'Product', 'Quantity', 'Unit Price', 'Total', 'Payment Method', 'Type'];
      const csvData = filteredPayments.map((p) => [
        p.receipt_number,
        new Date(p.receipt_date).toLocaleDateString(),
        p.product_name,
        p.quantity,
        p.unit_price,
        p.total,
        p.payment_method,
        p.transaction_type,
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map((row) => row.join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `product-payments-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: 'Payment report downloaded successfully',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.total, 0);
  const totalItems = filteredPayments.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-lg sm:text-xl">Product Payments Report</span>
          <Button onClick={exportToCSV} disabled={filteredPayments.length === 0} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardTitle>
        <CardDescription>
          Track all product sales and payments with detailed filtering
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search product or receipt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="mobile">Mobile Payment</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredPayments.length}</div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-sm text-muted-foreground">Items Sold</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Receipt #</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Qty</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden md:table-cell">Payment</TableHead>
                  <TableHead className="hidden lg:table-cell">Type</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs sm:text-sm hidden sm:table-cell">{payment.receipt_number}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">{new Date(payment.receipt_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-sm">{payment.product_name}</TableCell>
                    <TableCell className="text-right text-sm hidden sm:table-cell">{payment.quantity}</TableCell>
                    <TableCell className="text-right text-sm hidden lg:table-cell">{formatCurrency(payment.unit_price)}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">{formatCurrency(payment.total)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="capitalize text-sm">{payment.payment_method}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                        {payment.transaction_type.replace('_', ' ')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
