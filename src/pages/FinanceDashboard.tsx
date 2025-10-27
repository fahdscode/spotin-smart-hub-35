import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, Download, RefreshCw, PieChart, BarChart3, FileText, Wallet, CreditCard, Receipt, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SpotinHeader from '@/components/SpotinHeader';
import { LogoutButton } from '@/components/LogoutButton';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // Financial metrics state
  const [metrics, setMetrics] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    cashFlow: 0,
    unpaidBills: 0,
    assets: 0,
    liabilities: 0
  });

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [budgetComparison, setBudgetComparison] = useState<any[]>([]);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [vendorPayments, setVendorPayments] = useState<any[]>([]);

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

  useEffect(() => {
    fetchFinancialData();
  }, [selectedMonth]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(new Date(selectedMonth));
      const monthEnd = endOfMonth(new Date(selectedMonth));

      await Promise.all([
        fetchIncomeData(monthStart, monthEnd),
        fetchExpenseData(monthStart, monthEnd),
        fetchBudgetData(monthStart),
        fetchCashFlowData(),
        fetchVendorPayments(monthStart, monthEnd)
      ]);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeData = async (start: Date, end: Date) => {
    const { data: receipts } = await supabase
      .from('receipts')
      .select('total_amount, payment_method, transaction_type, receipt_date')
      .eq('status', 'completed')
      .gte('receipt_date', start.toISOString())
      .lte('receipt_date', end.toISOString());

    if (receipts) {
      const total = receipts.reduce((sum, r) => sum + Number(r.total_amount), 0);
      
      // Income breakdown by transaction type
      const breakdown = receipts.reduce((acc: any, r) => {
        const type = r.transaction_type || 'General Sales';
        acc[type] = (acc[type] || 0) + Number(r.total_amount);
        return acc;
      }, {});

      setIncomeBreakdown(
        Object.entries(breakdown).map(([name, value]) => ({
          name,
          value: Number(value)
        }))
      );

      return total;
    }
    return 0;
  };

  const fetchExpenseData = async (start: Date, end: Date) => {
    const { data: bills } = await supabase
      .from('bills')
      .select('*, bill_line_items(*)')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (bills) {
      const total = bills.reduce((sum, b) => sum + Number(b.amount), 0);
      const unpaid = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + Number(b.amount), 0);

      // Expense breakdown by category
      const breakdown = bills.reduce((acc: any, b) => {
        const category = b.category || 'Miscellaneous';
        acc[category] = (acc[category] || 0) + Number(b.amount);
        return acc;
      }, {});

      setExpenseBreakdown(
        Object.entries(breakdown).map(([name, value]) => ({
          name,
          value: Number(value)
        }))
      );

      setMetrics(prev => ({ ...prev, unpaidBills: unpaid }));
      return total;
    }
    return 0;
  };

  const fetchBudgetData = async (monthStart: Date) => {
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*')
      .eq('month_year', format(monthStart, 'yyyy-MM-dd'));

    if (budgets) {
      const comparison = budgets.map(b => ({
        category: b.category,
        planned: Number(b.planned_amount),
        actual: Number(b.actual_amount),
        variance: Number(b.actual_amount) - Number(b.planned_amount),
        type: b.budget_type
      }));
      setBudgetComparison(comparison);
    }
  };

  const fetchCashFlowData = async () => {
    // Get last 6 months of cash flow
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const { data: income } = await supabase
        .from('receipts')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('receipt_date', start.toISOString())
        .lte('receipt_date', end.toISOString());

      const { data: expenses } = await supabase
        .from('bills')
        .select('amount')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const totalIncome = income?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;

      months.push({
        month: format(date, 'MMM yyyy'),
        income: totalIncome,
        expenses: totalExpenses,
        netCashFlow: totalIncome - totalExpenses
      });
    }

    setCashFlowData(months);
    
    // Calculate current month metrics
    const currentMonth = months[months.length - 1];
    if (currentMonth) {
      const netProfit = currentMonth.income - currentMonth.expenses;
      const profitMargin = currentMonth.income > 0 ? (netProfit / currentMonth.income) * 100 : 0;

      setMetrics(prev => ({
        ...prev,
        totalIncome: currentMonth.income,
        totalExpenses: currentMonth.expenses,
        netProfit,
        profitMargin,
        cashFlow: currentMonth.netCashFlow
      }));
    }
  };

  const fetchVendorPayments = async (start: Date, end: Date) => {
    const { data: bills } = await supabase
      .from('bills')
      .select('*, vendors(name)')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('amount', { ascending: false })
      .limit(10);

    if (bills) {
      setVendorPayments(bills);
    }
  };

  const exportReport = (reportType: string) => {
    toast.success(`Exporting ${reportType} report...`);
    // Implementation for export functionality
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ceo')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Finance Portal
              </h1>
              <p className="text-muted-foreground">Comprehensive financial management and reporting</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = subMonths(new Date(), i);
                  return (
                    <SelectItem key={i} value={format(date, 'yyyy-MM')}>
                      {format(date, 'MMMM yyyy')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchFinancialData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <LogoutButton variant="outline" size="sm" />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalIncome)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign className={`h-4 w-4 ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.netProfit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.profitMargin.toFixed(1)}% margin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Bills</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.unpaidBills)}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Reports Tabs */}
        <Tabs defaultValue="pl" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="pl">P&L</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="balance">Balance</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="expense">Expenses</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>

          {/* Profit & Loss Report */}
          <TabsContent value="pl" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profit & Loss Statement</CardTitle>
                    <CardDescription>Income vs Expenses for {format(new Date(selectedMonth), 'MMMM yyyy')}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('P&L')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Income Section */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Income
                    </h3>
                    <div className="space-y-2">
                      {incomeBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm">{item.name}</span>
                          <span className="font-semibold text-green-600">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-3 bg-green-100 dark:bg-green-900/20 rounded-lg border-2 border-green-600">
                        <span className="font-semibold">Total Income</span>
                        <span className="font-bold text-green-600 text-lg">{formatCurrency(metrics.totalIncome)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      Expenses
                    </h3>
                    <div className="space-y-2">
                      {expenseBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm">{item.name}</span>
                          <span className="font-semibold text-red-600">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-3 bg-red-100 dark:bg-red-900/20 rounded-lg border-2 border-red-600">
                        <span className="font-semibold">Total Expenses</span>
                        <span className="font-bold text-red-600 text-lg">{formatCurrency(metrics.totalExpenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className={`p-4 rounded-lg border-2 ${metrics.netProfit >= 0 ? 'bg-green-50 dark:bg-green-900/10 border-green-600' : 'bg-red-50 dark:bg-red-900/10 border-red-600'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Net Profit / Loss</span>
                      <span className={`font-bold text-2xl ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(metrics.netProfit)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Profit Margin: {metrics.profitMargin.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Flow Report */}
          <TabsContent value="cashflow" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cash Flow Statement</CardTitle>
                    <CardDescription>6-month cash flow trend</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('Cash Flow')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Income" />
                    <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Expenses" />
                    <Line type="monotone" dataKey="netCashFlow" stroke="#8b5cf6" strokeWidth={3} name="Net Cash Flow" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balance Sheet */}
          <TabsContent value="balance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Balance Sheet</CardTitle>
                    <CardDescription>Assets, Liabilities, and Equity as of {format(new Date(selectedMonth), 'MMMM yyyy')}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('Balance Sheet')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Assets */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      Assets
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Cash & Bank</span>
                        <span className="font-semibold">{formatCurrency(metrics.cashFlow)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Accounts Receivable</span>
                        <span className="font-semibold">{formatCurrency(0)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Inventory</span>
                        <span className="font-semibold">{formatCurrency(0)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg border-2 border-blue-600 font-bold">
                        <span>Total Assets</span>
                        <span className="text-blue-600">{formatCurrency(metrics.cashFlow)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                      Liabilities
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Accounts Payable</span>
                        <span className="font-semibold">{formatCurrency(metrics.unpaidBills)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Loans</span>
                        <span className="font-semibold">{formatCurrency(0)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg border-2 border-orange-600 font-bold">
                        <span>Total Liabilities</span>
                        <span className="text-orange-600">{formatCurrency(metrics.unpaidBills)}</span>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between p-3 bg-primary/10 rounded-lg border-2 border-primary font-bold">
                          <span>Equity</span>
                          <span className="text-primary">{formatCurrency(metrics.cashFlow - metrics.unpaidBills)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Breakdown */}
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue Breakdown</CardTitle>
                    <CardDescription>Income by category</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('Revenue')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={incomeBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${((entry.value / metrics.totalIncome) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {incomeBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </RechartsPieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    {incomeBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(item.value)}</div>
                          <div className="text-xs text-muted-foreground">
                            {((item.value / metrics.totalIncome) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expense Breakdown */}
          <TabsContent value="expense" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Expense Breakdown</CardTitle>
                    <CardDescription>Costs by category</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('Expenses')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${((entry.value / metrics.totalExpenses) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </RechartsPieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    {expenseBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(item.value)}</div>
                          <div className="text-xs text-muted-foreground">
                            {((item.value / metrics.totalExpenses) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget vs Actual */}
          <TabsContent value="budget" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Budget vs Actual</CardTitle>
                    <CardDescription>Planned vs actual spending</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('Budget')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {budgetComparison.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No budget data available for this month</p>
                    <p className="text-sm mt-2">Set budgets in Operations portal</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={budgetComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="planned" fill="#8b5cf6" name="Planned" />
                      <Bar dataKey="actual" fill="#06b6d4" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Summary */}
          <TabsContent value="tax" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tax Summary</CardTitle>
                    <CardDescription>Tax report for {format(new Date(selectedMonth), 'MMMM yyyy')}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('Tax')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Gross Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(metrics.totalIncome)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Deductible Expenses</p>
                      <p className="text-2xl font-bold">{formatCurrency(metrics.totalExpenses)}</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                      <p className="text-sm text-muted-foreground mb-1">Taxable Income</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(metrics.netProfit)}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold mb-2">Estimated Tax Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">VAT (14%):</span>
                        <span className="font-semibold">{formatCurrency(metrics.totalIncome * 0.14)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Income Tax (22.5%):</span>
                        <span className="font-semibold">{formatCurrency(metrics.netProfit * 0.225)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-bold">
                        <span>Total Tax Liability:</span>
                        <span className="text-amber-600">{formatCurrency(metrics.totalIncome * 0.14 + metrics.netProfit * 0.225)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      * This is an estimate. Consult with your accountant for accurate tax calculations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendor Payments */}
          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vendor Payments</CardTitle>
                    <CardDescription>Top vendor expenses for {format(new Date(selectedMonth), 'MMMM yyyy')}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('Vendors')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {vendorPayments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No vendor payments for this month</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vendorPayments.map((bill: any) => (
                      <div key={bill.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex-1">
                          <div className="font-semibold">{bill.vendors?.name || 'Unknown Vendor'}</div>
                          <div className="text-sm text-muted-foreground">
                            {bill.bill_number} • {format(new Date(bill.created_at), 'MMM dd, yyyy')}
                          </div>
                          {bill.notes && (
                            <div className="text-xs text-muted-foreground mt-1">{bill.notes}</div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-lg">{formatCurrency(bill.amount)}</div>
                          <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                            bill.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/20' :
                            bill.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20' :
                            'bg-red-100 text-red-700 dark:bg-red-900/20'
                          }`}>
                            {bill.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FinanceDashboard;
