import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotinHeader from '@/components/SpotinHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientsData } from '@/hooks/useClientsData';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Calendar as CalendarIcon, DollarSign, ArrowLeft, Filter, Download, Search } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface VisitData {
  date: string;
  count: number;
}

interface SpendingData {
  client_name: string;
  total_spent: number;
  order_count: number;
}

interface ClientVisitCount {
  client_id: string;
  visit_count: number;
}

export default function CustomerAnalytics() {
  const navigate = useNavigate();
  const { clients, loading: clientsLoading, getLeadSources, getClientsByStatus } = useClientsData();
  
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [visitsFilter, setVisitsFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visitData, setVisitData] = useState<VisitData[]>([]);
  const [spendingData, setSpendingData] = useState<SpendingData[]>([]);
  const [clientVisits, setClientVisits] = useState<ClientVisitCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  useEffect(() => {
    fetchClientVisitCounts();
  }, []);

  const fetchClientVisitCounts = async () => {
    try {
      // Fetch all check-ins and count by client
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('client_id');

      const visitCounts: Record<string, number> = {};
      checkIns?.forEach(checkIn => {
        if (checkIn.client_id) {
          visitCounts[checkIn.client_id] = (visitCounts[checkIn.client_id] || 0) + 1;
        }
      });

      const visitCountsArray = Object.entries(visitCounts).map(([client_id, visit_count]) => ({
        client_id,
        visit_count
      }));

      setClientVisits(visitCountsArray);
    } catch (error) {
      console.error('Error fetching client visit counts:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch visit/check-in data
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('checked_in_at, client_id')
        .gte('checked_in_at', dateRange.from.toISOString())
        .lte('checked_in_at', dateRange.to.toISOString())
        .order('checked_in_at', { ascending: true });

      // Group by date
      const visitsByDate: Record<string, number> = {};
      checkIns?.forEach(checkIn => {
        const date = format(new Date(checkIn.checked_in_at), 'yyyy-MM-dd');
        visitsByDate[date] = (visitsByDate[date] || 0) + 1;
      });

      const visitChartData = Object.entries(visitsByDate).map(([date, count]) => ({
        date: format(new Date(date), 'MMM dd'),
        count
      }));

      setVisitData(visitChartData);

      // Fetch spending data
      const { data: orders } = await supabase
        .from('session_line_items')
        .select(`
          user_id,
          price,
          quantity,
          clients!inner(full_name)
        `)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .in('status', ['completed', 'served']);

      // Aggregate spending by client
      const spendingByClient: Record<string, { total: number; count: number; name: string }> = {};
      orders?.forEach((order: any) => {
        const clientId = order.user_id;
        const clientName = order.clients?.full_name || 'Unknown';
        const amount = order.price * order.quantity;
        
        if (!spendingByClient[clientId]) {
          spendingByClient[clientId] = { total: 0, count: 0, name: clientName };
        }
        spendingByClient[clientId].total += amount;
        spendingByClient[clientId].count += 1;
      });

      const topSpenders = Object.entries(spendingByClient)
        .map(([_, data]) => ({
          client_name: data.name,
          total_spent: data.total,
          order_count: data.count
        }))
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 10);

      setSpendingData(topSpenders);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter clients based on selected filters
  const filteredClients = clients.filter(client => {
    if (statusFilter !== 'all' && client.active.toString() !== statusFilter) return false;
    if (membershipFilter === 'with' && !client.membership?.is_active) return false;
    if (membershipFilter === 'without' && client.membership?.is_active) return false;
    
    // Filter by number of visits
    if (visitsFilter !== 'all') {
      const clientVisitData = clientVisits.find(v => v.client_id === client.id);
      const visitCount = clientVisitData?.visit_count || 0;
      
      switch(visitsFilter) {
        case '0-5':
          if (visitCount > 5) return false;
          break;
        case '6-10':
          if (visitCount < 6 || visitCount > 10) return false;
          break;
        case '11-20':
          if (visitCount < 11 || visitCount > 20) return false;
          break;
        case '20+':
          if (visitCount < 21) return false;
          break;
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        client.full_name.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone.toLowerCase().includes(query) ||
        client.client_code.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Calculate metrics
  const clientStats = getClientsByStatus();
  const totalRevenue = spendingData.reduce((sum, item) => sum + item.total_spent, 0);
  const avgOrderValue = spendingData.reduce((sum, item) => sum + (item.total_spent / item.order_count), 0) / (spendingData.length || 1);
  const totalOrders = spendingData.reduce((sum, item) => sum + item.order_count, 0);

  // Demographics data
  const jobTitles = filteredClients.reduce((acc: Record<string, number>, client) => {
    const title = client.job_title || 'Not specified';
    acc[title] = (acc[title] || 0) + 1;
    return acc;
  }, {});

  const jobTitleData = Object.entries(jobTitles)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const leadSourceData = getLeadSources().slice(0, 6);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

  // Export function
  const handleExport = () => {
    const exportData = filteredClients.map(client => {
      const clientVisitData = clientVisits.find(v => v.client_id === client.id);
      const visitCount = clientVisitData?.visit_count || 0;
      
      return {
        'Client Code': client.client_code,
        'Full Name': client.full_name,
        'Email': client.email || 'N/A',
        'Phone': client.phone,
        'Job Title': client.job_title,
        'Status': client.active ? 'Active' : 'Inactive',
        'Membership': client.membership?.plan_name || 'None',
        'Discount': client.membership?.discount_percentage ? `${client.membership.discount_percentage}%` : '0%',
        'Total Visits': visitCount,
        'How Found Us': client.how_did_you_find_us,
        'Registered Date': format(new Date(client.created_at), 'yyyy-MM-dd')
      };
    });

    // Convert to CSV
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          return `"${value}"`;
        }).join(',')
      )
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader />
      
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Customer Analytics</h1>
            <p className="text-muted-foreground">Detailed insights into customer behavior and demographics</p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 space-y-2">
                  <Button variant="outline" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>
                    Last 7 days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>
                    Last 30 days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}>
                    Last 90 days
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export ({filteredClients.length} customers)
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Membership</label>
              <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="with">With Membership</SelectItem>
                  <SelectItem value="without">Without Membership</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Number of Visits</label>
              <Select value={visitsFilter} onValueChange={setVisitsFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visits</SelectItem>
                  <SelectItem value="0-5">0-5 visits</SelectItem>
                  <SelectItem value="6-10">6-10 visits</SelectItem>
                  <SelectItem value="11-20">11-20 visits</SelectItem>
                  <SelectItem value="20+">20+ visits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or client code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {clientsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{filteredClients.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {clientStats.active} active, {clientStats.inactive} inactive
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">EGP {totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{totalOrders} orders</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">EGP {avgOrderValue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Per customer</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membership Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {clientsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {filteredClients.length > 0 
                      ? ((clientStats.withMembership / filteredClients.length) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">{clientStats.withMembership} members</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer List Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers ({filteredClients.length})</CardTitle>
            <CardDescription>Complete list of customers with filters applied</CardDescription>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Visits</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No customers found matching your filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => {
                        const clientVisitData = clientVisits.find(v => v.client_id === client.id);
                        const visitCount = clientVisitData?.visit_count || 0;
                        
                        return (
                          <TableRow key={client.id}>
                            <TableCell className="font-mono text-sm">{client.client_code}</TableCell>
                            <TableCell className="font-medium">{client.full_name}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{client.phone}</div>
                                {client.email && <div className="text-muted-foreground">{client.email}</div>}
                              </div>
                            </TableCell>
                            <TableCell>{client.job_title}</TableCell>
                            <TableCell>
                              <Badge variant={client.active ? "default" : "secondary"}>
                                {client.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {client.membership?.is_active ? (
                                <div>
                                  <div className="font-medium">{client.membership.plan_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {client.membership.discount_percentage}% discount
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">None</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{visitCount}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(client.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Tabs defaultValue="visits" className="space-y-4">
          <TabsList>
            <TabsTrigger value="visits">Visit Patterns</TabsTrigger>
            <TabsTrigger value="spending">Spending Behavior</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>

          {/* Visit Patterns */}
          <TabsContent value="visits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Check-ins Over Time</CardTitle>
                <CardDescription>Daily customer visits for selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={visitData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} name="Check-ins" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spending Behavior */}
          <TabsContent value="spending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Spenders</CardTitle>
                <CardDescription>Customers with highest spending in selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={spendingData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="client_name" type="category" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_spent" fill="hsl(var(--primary))" name="Total Spent (EGP)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demographics */}
          <TabsContent value="demographics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Customers by Job Title</CardTitle>
                  <CardDescription>Distribution of customer professions</CardDescription>
                </CardHeader>
                <CardContent>
                  {clientsLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={jobTitleData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {jobTitleData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                  <CardDescription>How customers found us</CardDescription>
                </CardHeader>
                <CardContent>
                  {clientsLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={leadSourceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="source" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="hsl(var(--secondary))" name="Customers" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
