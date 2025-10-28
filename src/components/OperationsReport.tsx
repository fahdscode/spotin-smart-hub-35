import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Calendar, TrendingUp, TrendingDown, Package, DollarSign, Ban, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import spotinLogo from '@/assets/spotin-logo-main.png';

interface ReportData {
  totalIncome: number;
  incomeBreakdown: {
    tickets: number;
    memberships: number;
    rooms: number;
    bar: number;
    events: number;
  };
  totalExpenses: number;
  cancelledOrders: {
    count: number;
    value: number;
  };
  inventoryValue: number;
  totalTransactions: number;
}

export const OperationsReport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [reportData, setReportData] = useState<ReportData>({
    totalIncome: 0,
    incomeBreakdown: { tickets: 0, memberships: 0, rooms: 0, bar: 0, events: 0 },
    totalExpenses: 0,
    cancelledOrders: { count: 0, value: 0 },
    inventoryValue: 0,
    totalTransactions: 0,
  });

  const SPOTIN_COLORS = {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    accent: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#ec4899',
  };

  const CHART_COLORS = [
    SPOTIN_COLORS.primary,
    SPOTIN_COLORS.secondary,
    SPOTIN_COLORS.accent,
    SPOTIN_COLORS.warning,
    SPOTIN_COLORS.danger,
    SPOTIN_COLORS.purple,
  ];

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Fetch receipts for income breakdown
      const { data: receipts, error: receiptsError } = await supabase
        .from('receipts')
        .select('*')
        .gte('receipt_date', startDate.toISOString())
        .eq('status', 'completed');

      if (receiptsError) throw receiptsError;

      // Calculate income breakdown
      const breakdown = {
        tickets: 0,
        memberships: 0,
        rooms: 0,
        bar: 0,
        events: 0,
      };

      let totalIncome = 0;
      let totalTransactions = receipts?.length || 0;

      receipts?.forEach((receipt) => {
        const amount = Number(receipt.total_amount);
        totalIncome += amount;

        switch (receipt.transaction_type) {
          case 'day_use_ticket':
            breakdown.tickets += amount;
            break;
          case 'membership':
            breakdown.memberships += amount;
            break;
          case 'room_booking':
            breakdown.rooms += amount;
            break;
          case 'event':
            breakdown.events += amount;
            break;
          default:
            breakdown.bar += amount;
            break;
        }
      });

      // Fetch expenses
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select('amount')
        .gte('created_at', startDate.toISOString());

      if (billsError) throw billsError;

      const totalExpenses = bills?.reduce((sum, bill) => sum + Number(bill.amount), 0) || 0;

      // Fetch cancelled orders
      const { data: cancelled, error: cancelledError } = await supabase
        .from('receipts')
        .select('*')
        .gte('receipt_date', startDate.toISOString())
        .eq('status', 'cancelled');

      if (cancelledError) throw cancelledError;

      const cancelledValue = cancelled?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;

      // Fetch inventory value
      const { data: stock, error: stockError } = await supabase
        .from('stock')
        .select('current_quantity, cost_per_unit')
        .eq('is_active', true);

      if (stockError) throw stockError;

      const inventoryValue = stock?.reduce(
        (sum, item) => sum + Number(item.current_quantity) * Number(item.cost_per_unit || 0),
        0
      ) || 0;

      setReportData({
        totalIncome,
        incomeBreakdown: breakdown,
        totalExpenses,
        cancelledOrders: {
          count: cancelled?.length || 0,
          value: cancelledValue,
        },
        inventoryValue,
        totalTransactions,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    try {
      const reportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      let csvContent = "SpotIN Operations Report\n";
      csvContent += `Generated: ${reportDate}\n`;
      csvContent += `Period: Last ${dateRange} days\n\n`;
      
      csvContent += "INCOME BREAKDOWN\n";
      csvContent += "Category,Amount\n";
      csvContent += `Tickets,${reportData.incomeBreakdown.tickets}\n`;
      csvContent += `Memberships,${reportData.incomeBreakdown.memberships}\n`;
      csvContent += `Rooms,${reportData.incomeBreakdown.rooms}\n`;
      csvContent += `Bar/Products,${reportData.incomeBreakdown.bar}\n`;
      csvContent += `Events,${reportData.incomeBreakdown.events}\n`;
      csvContent += `Total Income,${reportData.totalIncome}\n\n`;
      
      csvContent += "EXPENSES\n";
      csvContent += `Total Expenses,${reportData.totalExpenses}\n\n`;
      
      csvContent += "CANCELLED ORDERS\n";
      csvContent += `Count,${reportData.cancelledOrders.count}\n`;
      csvContent += `Value,${reportData.cancelledOrders.value}\n\n`;
      
      csvContent += "INVENTORY\n";
      csvContent += `Total Inventory Value,${reportData.inventoryValue}\n\n`;
      
      csvContent += "SUMMARY\n";
      csvContent += `Total Transactions,${reportData.totalTransactions}\n`;
      csvContent += `Net Profit,${reportData.totalIncome - reportData.totalExpenses}\n`;
      csvContent += `Profit Margin,${((reportData.totalIncome - reportData.totalExpenses) / reportData.totalIncome * 100).toFixed(2)}%\n`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `spotin-operations-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: 'Operations report downloaded successfully',
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

  const incomeChartData = [
    { name: 'Tickets', value: reportData.incomeBreakdown.tickets, color: CHART_COLORS[0] },
    { name: 'Memberships', value: reportData.incomeBreakdown.memberships, color: CHART_COLORS[1] },
    { name: 'Rooms', value: reportData.incomeBreakdown.rooms, color: CHART_COLORS[2] },
    { name: 'Bar', value: reportData.incomeBreakdown.bar, color: CHART_COLORS[3] },
    { name: 'Events', value: reportData.incomeBreakdown.events, color: CHART_COLORS[4] },
  ].filter(item => item.value > 0);

  const profitData = [
    {
      name: 'Financial Overview',
      Income: reportData.totalIncome,
      Expenses: reportData.totalExpenses,
      Profit: reportData.totalIncome - reportData.totalExpenses,
    },
  ];

  const netProfit = reportData.totalIncome - reportData.totalExpenses;
  const profitMargin = reportData.totalIncome > 0 
    ? ((netProfit / reportData.totalIncome) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header with Logo and Controls */}
      <Card style={{ borderColor: SPOTIN_COLORS.primary }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={spotinLogo} alt="SpotIN Logo" className="h-12 w-auto" />
              <div>
                <CardTitle className="text-2xl" style={{ color: SPOTIN_COLORS.primary }}>
                  Operations Report
                </CardTitle>
                <CardDescription>Comprehensive financial and operational analytics</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="180">Last 6 Months</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportReport} disabled={loading} style={{ backgroundColor: SPOTIN_COLORS.primary }}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={{ borderLeftWidth: '4px', borderLeftColor: SPOTIN_COLORS.primary }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold" style={{ color: SPOTIN_COLORS.primary }}>
                  {formatCurrency(reportData.totalIncome)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8" style={{ color: SPOTIN_COLORS.primary }} />
            </div>
          </CardContent>
        </Card>

        <Card style={{ borderLeftWidth: '4px', borderLeftColor: SPOTIN_COLORS.danger }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold" style={{ color: SPOTIN_COLORS.danger }}>
                  {formatCurrency(reportData.totalExpenses)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8" style={{ color: SPOTIN_COLORS.danger }} />
            </div>
          </CardContent>
        </Card>

        <Card style={{ borderLeftWidth: '4px', borderLeftColor: SPOTIN_COLORS.accent }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold" style={{ color: SPOTIN_COLORS.accent }}>
                  {formatCurrency(netProfit)}
                </p>
                <p className="text-xs text-muted-foreground">{profitMargin}% margin</p>
              </div>
              <DollarSign className="w-8 h-8" style={{ color: SPOTIN_COLORS.accent }} />
            </div>
          </CardContent>
        </Card>

        <Card style={{ borderLeftWidth: '4px', borderLeftColor: SPOTIN_COLORS.secondary }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold" style={{ color: SPOTIN_COLORS.secondary }}>
                  {formatCurrency(reportData.inventoryValue)}
                </p>
              </div>
              <Package className="w-8 h-8" style={{ color: SPOTIN_COLORS.secondary }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle style={{ color: SPOTIN_COLORS.primary }}>Income Breakdown</CardTitle>
            <CardDescription>Revenue distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incomeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incomeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle style={{ color: SPOTIN_COLORS.primary }}>Financial Overview</CardTitle>
            <CardDescription>Income vs Expenses vs Profit</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="Income" fill={SPOTIN_COLORS.primary} />
                <Bar dataKey="Expenses" fill={SPOTIN_COLORS.danger} />
                <Bar dataKey="Profit" fill={SPOTIN_COLORS.accent} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Details */}
        <Card>
          <CardHeader>
            <CardTitle style={{ color: SPOTIN_COLORS.primary }}>Income Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Tickets', value: reportData.incomeBreakdown.tickets, color: CHART_COLORS[0] },
                { label: 'Memberships', value: reportData.incomeBreakdown.memberships, color: CHART_COLORS[1] },
                { label: 'Rooms', value: reportData.incomeBreakdown.rooms, color: CHART_COLORS[2] },
                { label: 'Bar/Products', value: reportData.incomeBreakdown.bar, color: CHART_COLORS[3] },
                { label: 'Events', value: reportData.incomeBreakdown.events, color: CHART_COLORS[4] },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${item.color}15` }}>
                  <span className="font-medium">{item.label}</span>
                  <span className="font-bold" style={{ color: item.color }}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <Card>
          <CardHeader>
            <CardTitle style={{ color: SPOTIN_COLORS.primary }}>Additional Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" style={{ color: SPOTIN_COLORS.secondary }} />
                  <span className="font-medium">Total Transactions</span>
                </div>
                <span className="font-bold text-lg">{reportData.totalTransactions}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${SPOTIN_COLORS.danger}15` }}>
                <div className="flex items-center gap-2">
                  <Ban className="w-5 h-5" style={{ color: SPOTIN_COLORS.danger }} />
                  <span className="font-medium">Cancelled Orders</span>
                </div>
                <div className="text-right">
                  <div className="font-bold" style={{ color: SPOTIN_COLORS.danger }}>
                    {reportData.cancelledOrders.count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(reportData.cancelledOrders.value)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${SPOTIN_COLORS.accent}15` }}>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" style={{ color: SPOTIN_COLORS.accent }} />
                  <span className="font-medium">Inventory Value</span>
                </div>
                <span className="font-bold" style={{ color: SPOTIN_COLORS.accent }}>
                  {formatCurrency(reportData.inventoryValue)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${SPOTIN_COLORS.primary}15` }}>
                <span className="font-medium">Average Transaction</span>
                <span className="font-bold" style={{ color: SPOTIN_COLORS.primary }}>
                  {formatCurrency(reportData.totalTransactions > 0 ? reportData.totalIncome / reportData.totalTransactions : 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
