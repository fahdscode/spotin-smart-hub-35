import { useState, useEffect } from "react";
import { DollarSign, Users, Building, Calendar, Star, Coffee, TrendingUp, AlertTriangle, BarChart3, Smile, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import MetricCard from "@/components/MetricCard";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const CeoOverview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange] = useState({
    from: subMonths(new Date(), 1),
    to: new Date()
  });

  const [businessMetrics, setBusinessMetrics] = useState({
    avgOrderValue: 0,
    totalOrders: 0,
    repeatCustomerRate: 0,
    totalRevenue: 0,
    activeMembers: 0,
    occupancyRate: 0,
    eventsThisMonth: 0
  });

  const [satisfactionData, setSatisfactionData] = useState({
    averageRating: 0,
    totalFeedback: 0,
    ratingDistribution: [
      { rating: 5, count: 0, emoji: '😁' },
      { rating: 4, count: 0, emoji: '😊' },
      { rating: 3, count: 0, emoji: '🙂' },
      { rating: 2, count: 0, emoji: '😐' },
      { rating: 1, count: 0, emoji: '😞' }
    ]
  });

  const [peakHoursData, setPeakHoursData] = useState<Array<{ hour: string; visitors: number }>>([]);
  const [dailyRevenueData, setDailyRevenueData] = useState<Array<{ date: string; revenue: number }>>([]);

  const CHART_COLORS = {
    primary: 'hsl(var(--primary))',
    success: 'hsl(142 71% 45%)',
  };

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchBusinessMetrics(),
        fetchSatisfactionData(),
        fetchPeakHoursData(),
        fetchDailyRevenueData()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinessMetrics = async () => {
    try {
      const [ordersData, clientsData, eventsData, currentCheckInsData] = await Promise.all([
        supabase.from('session_line_items').select('price, quantity, user_id, created_at')
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString())
          .eq('status', 'completed'),
        supabase.from('clients').select('id, active').eq('is_active', true),
        supabase.from('events').select('id')
          .gte('event_date', format(dateRange.from, 'yyyy-MM-dd'))
          .lte('event_date', format(dateRange.to, 'yyyy-MM-dd'))
          .eq('is_active', true),
        supabase.from('check_ins').select('id').eq('status', 'checked_in')
      ]);

      const activeMembers = currentCheckInsData.data?.length || 0;
      const totalClients = clientsData.data?.length || 1;
      const occupancyRate = (activeMembers / totalClients) * 100;

      if (ordersData.data && ordersData.data.length > 0) {
        const totalRevenue = ordersData.data.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const avgOrder = totalRevenue / ordersData.data.length;
        const uniqueCustomers = new Set(ordersData.data.map(item => item.user_id)).size;
        const totalOrders = ordersData.data.length;
        const repeatRate = totalOrders > uniqueCustomers ? ((totalOrders - uniqueCustomers) / totalOrders) * 100 : 0;

        setBusinessMetrics({
          avgOrderValue: Number(avgOrder.toFixed(1)),
          totalOrders,
          repeatCustomerRate: Number(repeatRate.toFixed(0)),
          totalRevenue: Number(totalRevenue.toFixed(0)),
          activeMembers,
          occupancyRate: Number(occupancyRate.toFixed(0)),
          eventsThisMonth: eventsData.data?.length || 0
        });
      } else {
        setBusinessMetrics(prev => ({
          ...prev,
          activeMembers,
          occupancyRate: Number(occupancyRate.toFixed(0)),
          eventsThisMonth: eventsData.data?.length || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching business metrics:', error);
    }
  };

  const fetchSatisfactionData = async () => {
    try {
      const { data } = await supabase.from('feedback')
        .select('rating, emoji')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (data && data.length > 0) {
        const avgRating = data.reduce((sum, item) => sum + item.rating, 0) / data.length;
        const distribution = [1, 2, 3, 4, 5].map(rating => ({
          rating,
          count: data.filter(item => item.rating === rating).length,
          emoji: ['😞', '😐', '🙂', '😊', '😁'][rating - 1]
        }));

        setSatisfactionData({
          averageRating: Number(avgRating.toFixed(1)),
          totalFeedback: data.length,
          ratingDistribution: distribution
        });
      }
    } catch (error) {
      console.error('Error fetching satisfaction data:', error);
    }
  };

  const fetchPeakHoursData = async () => {
    try {
      const { data } = await supabase.from('check_ins')
        .select('checked_in_at')
        .gte('checked_in_at', dateRange.from.toISOString())
        .lte('checked_in_at', dateRange.to.toISOString())
        .eq('status', 'checked_in');

      if (data) {
        const hourCounts: Record<number, number> = {};
        data.forEach(item => {
          const hour = new Date(item.checked_in_at).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        const chartData = Array.from({ length: 16 }, (_, i) => {
          const hour = i + 6;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : hour;
          return {
            hour: `${displayHour}${ampm}`,
            visitors: hourCounts[hour] || 0
          };
        });

        setPeakHoursData(chartData);
      }
    } catch (error) {
      console.error('Error fetching peak hours data:', error);
    }
  };

  const fetchDailyRevenueData = async () => {
    try {
      const { data } = await supabase.from('session_line_items')
        .select('price, quantity, created_at')
        .gte('created_at', subDays(dateRange.to, 6).toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .eq('status', 'completed');

      if (data) {
        const dailyData: Record<string, number> = {};
        data.forEach(item => {
          const day = format(new Date(item.created_at), 'EEE');
          dailyData[day] = (dailyData[day] || 0) + (item.price * item.quantity);
        });

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const chartData = days.map(day => ({
          date: day,
          revenue: Number((dailyData[day] || 0).toFixed(0))
        }));

        setDailyRevenueData(chartData);
      }
    } catch (error) {
      console.error('Error fetching daily revenue data:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executive Overview</h1>
          <p className="text-muted-foreground">Real-time business intelligence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Revenue" value={`${businessMetrics.totalRevenue.toLocaleString()} EGP`} change="+12.5%" icon={DollarSign} variant="success" />
        <MetricCard title="Active Members" value={businessMetrics.activeMembers.toString()} change="+8" icon={Users} variant="info" />
        <MetricCard title="Occupancy Rate" value={`${businessMetrics.occupancyRate}%`} change="+5.2%" icon={Building} variant="default" />
        <MetricCard title="Events This Month" value={businessMetrics.eventsThisMonth.toString()} change="+15%" icon={Calendar} variant="success" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Peak Hours Analysis
            </CardTitle>
            <CardDescription>Visitor patterns throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="visitors" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Revenue Trend
            </CardTitle>
            <CardDescription>Last 7 days performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.success} fill={CHART_COLORS.success} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Traffic & Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Traffic</CardTitle>
            <CardDescription>Current occupancy status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="text-5xl font-bold text-primary">{businessMetrics.activeMembers}</div>
                <Badge className="absolute -top-2 -right-2 bg-green-500">Live</Badge>
              </div>
              <p className="text-muted-foreground">People currently inside</p>
              <Progress value={businessMetrics.occupancyRate} className="h-4" />
              <p className="text-sm text-muted-foreground">{businessMetrics.occupancyRate}% capacity</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5" />
              Customer Satisfaction
            </CardTitle>
            <CardDescription>Based on {satisfactionData.totalFeedback} responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-5xl font-bold text-primary">{satisfactionData.averageRating}</div>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`h-6 w-6 ${star <= Math.round(satisfactionData.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <div className="space-y-2 mt-4">
                {satisfactionData.ratingDistribution.map(item => (
                  <div key={item.rating} className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <Progress value={(item.count / satisfactionData.totalFeedback) * 100} className="h-2" />
                    <span className="text-sm w-8">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
          <CardDescription>Important notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Low Coffee Stock</p>
                <p className="text-xs text-muted-foreground">Only 12 units remaining</p>
              </div>
              <Badge variant="outline">High</Badge>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Revenue Milestone</p>
                <p className="text-xs text-muted-foreground">Monthly target 85% achieved</p>
              </div>
              <Badge variant="secondary">Info</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CeoOverview;
