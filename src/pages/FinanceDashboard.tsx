import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, Download, RefreshCw, PieChart, BarChart3, FileText, Wallet, CreditCard, Receipt, Building, Plus, Edit, Trash2, Clock, User, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
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
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cashierSessions, setCashierSessions] = useState<any[]>([]);
  
  // Form state for new expense
  const [newExpense, setNewExpense] = useState({
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    amount: '',
    description: '',
    payment_method: 'cash',
    vendor_id: '',
    reference_number: ''
  });

  // Form state for new income
  const [newIncome, setNewIncome] = useState({
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    amount: '',
    description: '',
    payment_method: 'cash',
    reference_number: ''
  });
  
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
    fetchCategories();
    fetchVendors();
  }, [selectedMonth, dateRange, useCustomRange]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (data) setCategories(data);
  };

  const fetchVendors = async () => {
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (data) setVendors(data);
  };

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      let monthStart: Date, monthEnd: Date;
      
      if (useCustomRange && dateRange.from && dateRange.to) {
        monthStart = dateRange.from;
        monthEnd = dateRange.to;
      } else {
        monthStart = startOfMonth(new Date(selectedMonth));
        monthEnd = endOfMonth(new Date(selectedMonth));
      }

      await Promise.all([
        fetchIncomeData(monthStart, monthEnd),
        fetchExpenseData(monthStart, monthEnd),
        fetchBudgetData(monthStart),
        fetchCashFlowData(),
        fetchVendorPayments(monthStart, monthEnd),
        fetchTransactions(monthStart, monthEnd),
        fetchCashierSessions(monthStart, monthEnd)
      ]);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (start: Date, end: Date) => {
    const { data } = await supabase
      .from('financial_transactions')
      .select('*, vendors(name)')
      .gte('transaction_date', format(start, 'yyyy-MM-dd'))
      .lte('transaction_date', format(end, 'yyyy-MM-dd'))
      .order('transaction_date', { ascending: false });

    if (data) setTransactions(data);
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

  const fetchCashierSessions = async (start: Date, end: Date) => {
    const { data: sessions } = await supabase
      .from('cashier_sessions')
      .select('*')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time', { ascending: false });

    if (sessions) {
      setCashierSessions(sessions);
    }
  };

  const exportReport = (reportType: string) => {
    toast.success(`Exporting ${reportType} report...`);
    // Implementation for export functionality
  };

  const handleAddExpense = async () => {
    // Validation
    if (!newExpense.category || !newExpense.amount || !newExpense.transaction_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (newExpense.description.length > 500) {
      toast.error('Description must be less than 500 characters');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('financial_transactions')
        .insert({
          transaction_date: newExpense.transaction_date,
          transaction_type: 'expense',
          category: newExpense.category,
          amount: amount,
          description: newExpense.description.trim() || null,
          payment_method: newExpense.payment_method,
          vendor_id: newExpense.vendor_id || null,
          reference_number: newExpense.reference_number.trim() || null,
          created_by: user?.id
        });

      if (error) {
        console.error('Error adding expense:', error);
        throw error;
      }

      toast.success('Expense added successfully');
      setShowAddExpense(false);
      setNewExpense({
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        category: '',
        amount: '',
        description: '',
        payment_method: 'cash',
        vendor_id: '',
        reference_number: ''
      });
      fetchFinancialData();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleAddIncome = async () => {
    // Validation
    if (!newIncome.category || !newIncome.amount || !newIncome.transaction_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(newIncome.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (newIncome.description.length > 500) {
      toast.error('Description must be less than 500 characters');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('financial_transactions')
        .insert({
          transaction_date: newIncome.transaction_date,
          transaction_type: 'income',
          category: newIncome.category,
          amount: amount,
          description: newIncome.description.trim() || null,
          payment_method: newIncome.payment_method,
          reference_number: newIncome.reference_number.trim() || null,
          created_by: user?.id
        });

      if (error) {
        console.error('Error adding income:', error);
        throw error;
      }

      toast.success('Income added successfully');
      setShowAddIncome(false);
      setNewIncome({
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        category: '',
        amount: '',
        description: '',
        payment_method: 'cash',
        reference_number: ''
      });
      fetchFinancialData();
    } catch (error) {
      console.error('Error adding income:', error);
      toast.error('Failed to add income');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Transaction deleted successfully');
      fetchFinancialData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
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
            <Button onClick={() => setShowAddIncome(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
            <Button onClick={() => setShowAddExpense(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
            
            {/* Date Filter Toggle */}
            <div className="flex items-center gap-2 border-l pl-2 ml-2">
              <Button
                variant={useCustomRange ? "outline" : "default"}
                size="sm"
                onClick={() => setUseCustomRange(false)}
              >
                Month
              </Button>
              <Button
                variant={useCustomRange ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCustomRange(true)}
              >
                Custom Range
              </Button>
            </div>

            {/* Month Selector */}
            {!useCustomRange && (
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
            )}

            {/* Custom Date Range Picker */}
            {useCustomRange && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => {
                        setDateRange({
                          from: range?.from,
                          to: range?.to
                        });
                      }}
                      numberOfMonths={2}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

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
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
            <TabsTrigger value="pl">P&L</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="balance">Balance</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="expense">Expenses</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
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

          {/* Cashier Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cashier Sessions</CardTitle>
                    <CardDescription>Staff session tracking for {format(new Date(selectedMonth), 'MMMM yyyy')}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('Cashier Sessions')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {cashierSessions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No cashier sessions for this month</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cashierSessions.map((session: any) => (
                      <div key={session.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold">{session.staff_name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {format(new Date(session.start_time), 'MMM dd, yyyy • hh:mm a')}
                                {session.end_time && (
                                  <> → {format(new Date(session.end_time), 'hh:mm a')}</>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {session.is_active ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20">
                                <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                                Active
                              </span>
                            ) : (
                              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800">
                                Closed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 pt-3 border-t">
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="text-xs text-muted-foreground mb-1">Opening</div>
                            <div className="font-semibold text-sm">{formatCurrency(session.opening_cash)}</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 dark:bg-green-900/10 rounded">
                            <div className="text-xs text-muted-foreground mb-1">Cash</div>
                            <div className="font-semibold text-sm text-green-600">{formatCurrency(session.cash_sales)}</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/10 rounded">
                            <div className="text-xs text-muted-foreground mb-1">Visa</div>
                            <div className="font-semibold text-sm text-blue-600">{formatCurrency(session.card_sales)}</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/10 rounded">
                            <div className="text-xs text-muted-foreground mb-1">Transfer</div>
                            <div className="font-semibold text-sm text-purple-600">{formatCurrency(session.bank_transfer_sales || 0)}</div>
                          </div>
                          <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/10 rounded">
                            <div className="text-xs text-muted-foreground mb-1">Hot Desk</div>
                            <div className="font-semibold text-sm text-orange-600">{formatCurrency(session.hot_desk_sales || 0)}</div>
                          </div>
                        </div>

                        {/* Total Sales */}
                        <div className="mt-3 pt-3 border-t flex items-center justify-between">
                          <span className="font-semibold">Total Sales</span>
                          <span className="text-lg font-bold text-primary">{formatCurrency(session.total_sales)}</span>
                        </div>

                        {/* Closing Info */}
                        {!session.is_active && (
                          <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <div className="text-muted-foreground">Expected</div>
                              <div className="font-semibold">{formatCurrency(session.expected_cash || 0)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Closing</div>
                              <div className="font-semibold">{formatCurrency(session.closing_cash || 0)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Difference</div>
                              <div className={`font-semibold ${
                                (session.cash_difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {session.cash_difference >= 0 ? '+' : ''}{formatCurrency(session.cash_difference || 0)}
                              </div>
                            </div>
                          </div>
                        )}

                        {session.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs text-muted-foreground mb-1">Notes:</div>
                            <div className="text-sm">{session.notes}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Transactions</CardTitle>
                    <CardDescription>Complete transaction history for {format(new Date(selectedMonth), 'MMMM yyyy')}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportReport('Transactions')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions for this month</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((txn: any) => (
                      <div key={txn.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`font-semibold ${txn.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {txn.category}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              txn.transaction_type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/20' :
                              'bg-red-100 text-red-700 dark:bg-red-900/20'
                            }`}>
                              {txn.transaction_type}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {format(new Date(txn.transaction_date), 'MMM dd, yyyy')} • {txn.payment_method}
                            {txn.vendors?.name && ` • ${txn.vendors.name}`}
                          </div>
                          {txn.description && (
                            <div className="text-xs text-muted-foreground mt-1">{txn.description}</div>
                          )}
                          {txn.reference_number && (
                            <div className="text-xs text-muted-foreground">Ref: {txn.reference_number}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-right">
                            <div className={`font-bold text-lg ${txn.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {txn.transaction_type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTransaction(txn.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Expense Dialog */}
        <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>Record a new expense transaction</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expense-date">Date *</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={newExpense.transaction_date}
                    onChange={(e) => setNewExpense({ ...newExpense, transaction_date: e.target.value })}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <Label htmlFor="expense-amount">Amount (EGP) *</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expense-category">Category *</Label>
                <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                  <SelectTrigger id="expense-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expense-vendor">Vendor (Optional)</Label>
                <Select value={newExpense.vendor_id} onValueChange={(value) => setNewExpense({ ...newExpense, vendor_id: value })}>
                  <SelectTrigger id="expense-vendor">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expense-payment">Payment Method</Label>
                <Select value={newExpense.payment_method} onValueChange={(value) => setNewExpense({ ...newExpense, payment_method: value })}>
                  <SelectTrigger id="expense-payment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expense-reference">Reference Number (Optional)</Label>
                <Input
                  id="expense-reference"
                  placeholder="Invoice #, Receipt #, etc."
                  value={newExpense.reference_number}
                  onChange={(e) => setNewExpense({ ...newExpense, reference_number: e.target.value.slice(0, 100) })}
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="expense-description">Description (Optional)</Label>
                <Textarea
                  id="expense-description"
                  placeholder="Additional notes..."
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value.slice(0, 500) })}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {newExpense.description.length}/500 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddExpense(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddExpense} className="bg-red-600 hover:bg-red-700">
                Add Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Income Dialog */}
        <Dialog open={showAddIncome} onOpenChange={setShowAddIncome}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Income</DialogTitle>
              <DialogDescription>Record a new income transaction</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="income-date">Date *</Label>
                  <Input
                    id="income-date"
                    type="date"
                    value={newIncome.transaction_date}
                    onChange={(e) => setNewIncome({ ...newIncome, transaction_date: e.target.value })}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <Label htmlFor="income-amount">Amount (EGP) *</Label>
                  <Input
                    id="income-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="income-category">Category *</Label>
                <Select value={newIncome.category} onValueChange={(value) => setNewIncome({ ...newIncome, category: value })}>
                  <SelectTrigger id="income-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Memberships">Memberships</SelectItem>
                    <SelectItem value="Room Bookings">Room Bookings</SelectItem>
                    <SelectItem value="Events">Events</SelectItem>
                    <SelectItem value="Other Income">Other Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="income-payment">Payment Method</Label>
                <Select value={newIncome.payment_method} onValueChange={(value) => setNewIncome({ ...newIncome, payment_method: value })}>
                  <SelectTrigger id="income-payment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="income-reference">Reference Number (Optional)</Label>
                <Input
                  id="income-reference"
                  placeholder="Receipt #, Transaction #, etc."
                  value={newIncome.reference_number}
                  onChange={(e) => setNewIncome({ ...newIncome, reference_number: e.target.value.slice(0, 100) })}
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="income-description">Description (Optional)</Label>
                <Textarea
                  id="income-description"
                  placeholder="Additional notes..."
                  value={newIncome.description}
                  onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value.slice(0, 500) })}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {newIncome.description.length}/500 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddIncome(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddIncome} className="bg-green-600 hover:bg-green-700">
                Add Income
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FinanceDashboard;
