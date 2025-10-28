import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Download, Calendar, TrendingUp, TrendingDown, Package, DollarSign, Ban, BarChart3, CalendarRange, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import spotinLogo from '@/assets/spotin-logo-main.png';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

        // Track all ticket types (day_use, coworking, etc.) from operations portal
        const transactionType = receipt.transaction_type?.toLowerCase() || '';
        
        if (transactionType.includes('ticket') || transactionType === 'day_use' || transactionType === 'coworking') {
          breakdown.tickets += amount;
        } else if (transactionType === 'membership') {
          breakdown.memberships += amount;
        } else if (transactionType === 'room_booking' || transactionType === 'room') {
          breakdown.rooms += amount;
        } else if (transactionType === 'event') {
          breakdown.events += amount;
        } else {
          // All other transactions (drinks, products, etc.)
          breakdown.bar += amount;
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

  const exportReport = async () => {
    try {
      console.log('Starting PDF export...');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // SpotIN Brand Colors (RGB)
      const primaryColor: [number, number, number] = [108, 117, 125];
      const accentColor: [number, number, number] = [255, 152, 0];
      const successColor: [number, number, number] = [76, 175, 80];
      const dangerColor: [number, number, number] = [244, 67, 54];
      const textColor: [number, number, number] = [33, 33, 33];
      const lightBg: [number, number, number] = [245, 245, 245];

      // Add SpotIN Logo
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = spotinLogo;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => {
            console.log('Logo failed to load, continuing without it');
            resolve(null);
          };
          setTimeout(() => resolve(null), 2000); // Timeout after 2 seconds
        });
        
        if (img.complete && img.naturalHeight !== 0) {
          doc.addImage(img, 'PNG', 15, 10, 40, 12);
        }
      } catch (error) {
        console.log('Error loading logo:', error);
      }

      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Operations Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const reportDate = format(new Date(), 'MMMM dd, yyyy');
      const dateRangeText = filterType === 'custom' && customStartDate 
        ? `${format(customStartDate, 'MMM dd, yyyy')} - ${customEndDate ? format(customEndDate, 'MMM dd, yyyy') : 'Now'}`
        : dateRange === 'today' ? 'Today'
        : dateRange === 'yesterday' ? 'Yesterday'
        : dateRange === 'month' ? 'This Month'
        : dateRange === 'year' ? 'This Year'
        : `Last ${dateRange} days`;
      doc.text(`Generated: ${reportDate} | Period: ${dateRangeText}`, pageWidth / 2, 28, { align: 'center' });

      let yPos = 45;

      // Key Metrics Section
      doc.setTextColor(...textColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Metrics', 15, yPos);
      yPos += 8;

      const metrics = [
        { label: 'Total Income', value: formatCurrency(reportData.totalIncome), color: primaryColor },
        { label: 'Total Expenses', value: formatCurrency(reportData.totalExpenses), color: dangerColor },
        { label: 'Net Profit', value: formatCurrency(netProfit), color: successColor },
        { label: 'Profit Margin', value: `${profitMargin}%`, color: accentColor },
      ];

      metrics.forEach((metric, index) => {
        const xPos = 15 + (index % 2) * 95;
        const yOffset = yPos + Math.floor(index / 2) * 22;
        
        doc.setFillColor(...lightBg);
        doc.roundedRect(xPos, yOffset, 90, 18, 3, 3, 'F');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(metric.label, xPos + 5, yOffset + 7);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...metric.color);
        doc.text(metric.value, xPos + 5, yOffset + 14);
      });

      yPos += 50;

      // Income Breakdown Table
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textColor);
      doc.text('Income Breakdown', 15, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Amount', 'Percentage']],
        body: [
          ['Tickets', formatCurrency(reportData.incomeBreakdown.tickets), `${reportData.totalIncome > 0 ? ((reportData.incomeBreakdown.tickets / reportData.totalIncome) * 100).toFixed(1) : 0}%`],
          ['Memberships', formatCurrency(reportData.incomeBreakdown.memberships), `${reportData.totalIncome > 0 ? ((reportData.incomeBreakdown.memberships / reportData.totalIncome) * 100).toFixed(1) : 0}%`],
          ['Rooms', formatCurrency(reportData.incomeBreakdown.rooms), `${reportData.totalIncome > 0 ? ((reportData.incomeBreakdown.rooms / reportData.totalIncome) * 100).toFixed(1) : 0}%`],
          ['Bar/Products', formatCurrency(reportData.incomeBreakdown.bar), `${reportData.totalIncome > 0 ? ((reportData.incomeBreakdown.bar / reportData.totalIncome) * 100).toFixed(1) : 0}%`],
          ['Events', formatCurrency(reportData.incomeBreakdown.events), `${reportData.totalIncome > 0 ? ((reportData.incomeBreakdown.events / reportData.totalIncome) * 100).toFixed(1) : 0}%`],
        ],
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: lightBg },
        margin: { left: 15, right: 15 },
        theme: 'grid',
      });

      const finalY = (doc as any).lastAutoTable.finalY || yPos + 60;
      yPos = finalY + 15;

      // Additional Metrics
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Metrics', 15, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Total Transactions', reportData.totalTransactions.toString()],
          ['Average Transaction', formatCurrency(reportData.totalTransactions > 0 ? reportData.totalIncome / reportData.totalTransactions : 0)],
          ['Cancelled Orders', `${reportData.cancelledOrders.count} (${formatCurrency(reportData.cancelledOrders.value)})`],
          ['Inventory Value', formatCurrency(reportData.inventoryValue)],
        ],
        headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: lightBg },
        margin: { left: 15, right: 15 },
        theme: 'grid',
      });

      // Footer
      const footerY = pageHeight - 15;
      doc.setFillColor(...primaryColor);
      doc.rect(0, footerY, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('SpotIN - Smart Coworking Space Management', pageWidth / 2, footerY + 9, { align: 'center' });

      // Save PDF
      doc.save(`spotin-operations-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      console.log('PDF export completed successfully');
      
      toast({
        title: 'Export Successful',
        description: 'Professional PDF report downloaded successfully',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to generate PDF report',
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
                <PopoverContent className="w-80 p-0" align="start" sideOffset={5}>
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Select Period</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={filterType === 'preset' && dateRange === 'today' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('today'); }}
                          className="justify-start"
                        >
                          Today
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === 'yesterday' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('yesterday'); }}
                          className="justify-start"
                        >
                          Yesterday
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === '7' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('7'); }}
                          className="justify-start"
                        >
                          Last 7 Days
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === '30' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('30'); }}
                          className="justify-start"
                        >
                          Last 30 Days
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === 'month' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('month'); }}
                          className="justify-start"
                        >
                          This Month
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === '90' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('90'); }}
                          className="justify-start"
                        >
                          Last 3 Months
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === 'year' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('year'); }}
                          className="justify-start"
                        >
                          This Year
                        </Button>
                        <Button
                          variant={filterType === 'preset' && dateRange === '365' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setFilterType('preset'); setDateRange('365'); }}
                          className="justify-start"
                        >
                          Last 12 Months
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (filterType === 'custom') {
                            setFilterType('preset');
                            setCustomStartDate(undefined);
                            setCustomEndDate(undefined);
                          } else {
                            setFilterType('custom');
                          }
                        }}
                        className="w-full justify-start"
                      >
                        <CalendarRange className="w-4 h-4 mr-2" />
                        {filterType === 'custom' ? 'Back to Presets' : 'Custom Date Range'}
                      </Button>

                      {filterType === 'custom' && (
                        <div className="space-y-3 mt-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">From</label>
                            <CalendarComponent
                              mode="single"
                              selected={customStartDate}
                              onSelect={setCustomStartDate}
                              className="rounded-md border pointer-events-auto"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">To (Optional)</label>
                            <CalendarComponent
                              mode="single"
                              selected={customEndDate}
                              onSelect={setCustomEndDate}
                              disabled={(date) => customStartDate ? date < customStartDate : false}
                              className="rounded-md border pointer-events-auto"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button 
                onClick={exportReport} 
                disabled={loading} 
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent-hover text-white shadow-lg"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export PDF Report
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
