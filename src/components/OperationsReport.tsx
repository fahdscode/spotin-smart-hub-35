import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Download, Calendar, TrendingUp, TrendingDown, Package, DollarSign, Ban, BarChart3, CalendarRange } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import spotinLogo from '@/assets/spotin-logo-main.png';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [filterType, setFilterType] = useState<'preset' | 'custom'>('preset');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [reportData, setReportData] = useState<ReportData>({
    totalIncome: 0,
    incomeBreakdown: { tickets: 0, memberships: 0, rooms: 0, bar: 0, events: 0 },
    totalExpenses: 0,
    cancelledOrders: { count: 0, value: 0 },
    inventoryValue: 0,
    totalTransactions: 0,
  });

  // Use semantic color tokens that work in both light and dark mode
  const CHART_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
    'hsl(var(--info))',
  ];

  useEffect(() => {
    fetchReportData();
  }, [dateRange, customStartDate, customEndDate, filterType]);

  const getDateRange = () => {
    if (filterType === 'custom' && customStartDate) {
      return {
        start: customStartDate,
        end: customEndDate || new Date()
      };
    }
    
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case 'lastweek':
        start.setDate(start.getDate() - start.getDay() - 7);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - end.getDay() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'lastmonth':
        start.setMonth(start.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'quarter':
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        start.setDate(start.getDate() - parseInt(dateRange));
    }
    
    return { start, end };
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { start: startDate, end: endDate } = getDateRange();

      // Fetch receipts for income breakdown
      const { data: receipts, error: receiptsError } = await supabase
        .from('receipts')
        .select('*')
        .gte('receipt_date', startDate.toISOString())
        .lte('receipt_date', endDate.toISOString())
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
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (billsError) throw billsError;

      const totalExpenses = bills?.reduce((sum, bill) => sum + Number(bill.amount), 0) || 0;

      // Fetch cancelled orders
      const { data: cancelled, error: cancelledError } = await supabase
        .from('receipts')
        .select('*')
        .gte('receipt_date', startDate.toISOString())
        .lte('receipt_date', endDate.toISOString())
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
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
              <img src={spotinLogo} alt="SpotIN Logo" className="h-10 sm:h-12 w-auto" />
              <div>
                <CardTitle className="text-xl sm:text-2xl text-primary">
                  Operations Report
                </CardTitle>
                <CardDescription className="text-sm">Comprehensive financial and operational analytics</CardDescription>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal">
                    <CalendarRange className="w-4 h-4 mr-2" />
                    {filterType === 'custom' && customStartDate ? (
                      <>
                        {format(customStartDate, 'MMM dd, yyyy')} - {customEndDate ? format(customEndDate, 'MMM dd, yyyy') : 'Now'}
                      </>
                    ) : (
                      <span>
                        {dateRange === 'today' && 'Today'}
                        {dateRange === 'yesterday' && 'Yesterday'}
                        {dateRange === 'week' && 'This Week'}
                        {dateRange === 'lastweek' && 'Last Week'}
                        {dateRange === 'month' && 'This Month'}
                        {dateRange === 'lastmonth' && 'Last Month'}
                        {dateRange === 'quarter' && 'This Quarter'}
                        {dateRange === 'year' && 'This Year'}
                        {dateRange === '7' && 'Last 7 Days'}
                        {dateRange === '30' && 'Last 30 Days'}
                        {dateRange === '90' && 'Last 90 Days'}
                        {dateRange === '180' && 'Last 6 Months'}
                        {dateRange === '365' && 'Last Year'}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Quick Filters</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={filterType === 'preset' && dateRange === 'today' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('today'); }}
                          className="text-xs"
                        >
                          Today
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === 'yesterday' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('yesterday'); }}
                          className="text-xs"
                        >
                          Yesterday
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === 'week' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('week'); }}
                          className="text-xs"
                        >
                          This Week
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === 'lastweek' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('lastweek'); }}
                          className="text-xs"
                        >
                          Last Week
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === 'month' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('month'); }}
                          className="text-xs"
                        >
                          This Month
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === 'lastmonth' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('lastmonth'); }}
                          className="text-xs"
                        >
                          Last Month
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === 'quarter' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('quarter'); }}
                          className="text-xs"
                        >
                          This Quarter
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === 'year' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('year'); }}
                          className="text-xs"
                        >
                          This Year
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Rolling Periods</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={filterType === 'preset' && dateRange === '7' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('7'); }}
                          className="text-xs"
                        >
                          Last 7 Days
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === '30' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('30'); }}
                          className="text-xs"
                        >
                          Last 30 Days
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === '90' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('90'); }}
                          className="text-xs"
                        >
                          Last 90 Days
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === '365' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('365'); }}
                          className="text-xs"
                        >
                          Last Year
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 border-t pt-3">
                      <h4 className="font-semibold text-sm">Custom Range</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Start Date</label>
                          <CalendarComponent
                            mode="single"
                            selected={customStartDate}
                            onSelect={(date) => {
                              setCustomStartDate(date);
                              setFilterType('custom');
                            }}
                            className={cn("rounded-md border pointer-events-auto")}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">End Date (Optional)</label>
                          <CalendarComponent
                            mode="single"
                            selected={customEndDate}
                            onSelect={(date) => {
                              setCustomEndDate(date);
                              setFilterType('custom');
                            }}
                            disabled={(date) => customStartDate ? date < customStartDate : false}
                            className={cn("rounded-md border pointer-events-auto")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button onClick={exportReport} disabled={loading} className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-primary-foreground">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Income</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  {formatCurrency(reportData.totalIncome)}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl sm:text-2xl font-bold text-destructive">
                  {formatCurrency(reportData.totalExpenses)}
                </p>
              </div>
              <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Net Profit</p>
                <p className="text-xl sm:text-2xl font-bold text-success">
                  {formatCurrency(netProfit)}
                </p>
                <p className="text-xs text-muted-foreground">{profitMargin}% margin</p>
              </div>
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-xl sm:text-2xl font-bold text-accent">
                  {formatCurrency(reportData.inventoryValue)}
                </p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Income Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-primary">Income Breakdown</CardTitle>
            <CardDescription className="text-sm">Revenue distribution by category</CardDescription>
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
                  outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {incomeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '12px' : '14px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-primary">Financial Overview</CardTitle>
            <CardDescription>Income vs Expenses vs Profit</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Bar dataKey="Income" fill="hsl(var(--primary))" />
                <Bar dataKey="Expenses" fill="hsl(var(--destructive))" />
                <Bar dataKey="Profit" fill="hsl(var(--success))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Income Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-primary">Income Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Tickets', value: reportData.incomeBreakdown.tickets, className: 'bg-primary/10', textClass: 'text-primary' },
                { label: 'Memberships', value: reportData.incomeBreakdown.memberships, className: 'bg-accent/10', textClass: 'text-accent' },
                { label: 'Rooms', value: reportData.incomeBreakdown.rooms, className: 'bg-success/10', textClass: 'text-success' },
                { label: 'Bar/Products', value: reportData.incomeBreakdown.bar, className: 'bg-warning/10', textClass: 'text-warning' },
                { label: 'Events', value: reportData.incomeBreakdown.events, className: 'bg-destructive/10', textClass: 'text-destructive' },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between p-3 rounded-lg ${item.className}`}>
                  <span className="font-medium text-sm sm:text-base">{item.label}</span>
                  <span className={`font-bold text-sm sm:text-base ${item.textClass}`}>
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
            <CardTitle className="text-lg sm:text-xl text-primary">Additional Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  <span className="font-medium text-sm sm:text-base">Total Transactions</span>
                </div>
                <span className="font-bold text-base sm:text-lg">{reportData.totalTransactions}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                  <span className="font-medium text-sm sm:text-base">Cancelled Orders</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm sm:text-base text-destructive">
                    {reportData.cancelledOrders.count}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {formatCurrency(reportData.cancelledOrders.value)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                  <span className="font-medium text-sm sm:text-base">Inventory Value</span>
                </div>
                <span className="font-bold text-sm sm:text-base text-success">
                  {formatCurrency(reportData.inventoryValue)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                <span className="font-medium text-sm sm:text-base">Average Transaction</span>
                <span className="font-bold text-sm sm:text-base text-primary">
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
