import { ArrowLeft, TrendingUp, Users, DollarSign, Calendar, Coffee, AlertTriangle, Building, BarChart3, UserCog, Star, Smile, PieChart, Filter, Download, RefreshCw, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import KPIManagement from "@/components/KPIManagement";
import RolesManagement from "@/components/RolesManagement";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";

const CeoDashboard = () => {
  const navigate = useNavigate();

  // Date filter states
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  const [quickFilter, setQuickFilter] = useState<string>("30days");
  const [isLoading, setIsLoading] = useState(false);

  // State for analytics data
  const [satisfactionData, setSatisfactionData] = useState({
    averageRating: 4.2,
    totalFeedback: 156,
    ratingDistribution: [
      { rating: 5, count: 78, emoji: '😁' },
      { rating: 4, count: 45, emoji: '😊' },
      { rating: 3, count: 21, emoji: '🙂' },
      { rating: 2, count: 8, emoji: '😐' },
      { rating: 1, count: 4, emoji: '😞' },
    ]
  });

  const [businessMetrics, setBusinessMetrics] = useState({
    avgOrderValue: 45.5,
    totalOrders: 1247,
    repeatCustomerRate: 68,
    totalRevenue: 27500,
    activeMembers: 147,
    occupancyRate: 78,
    eventsThisMonth: 23
  });

  const [demographicData, setDemographicData] = useState({
    genderDistribution: [
      { gender: 'Male', percentage: 52, count: 76 },
      { gender: 'Female', percentage: 45, count: 66 },
      { gender: 'Other', percentage: 3, count: 5 }
    ],
    ageGroups: [
      { group: '18-25', percentage: 28, count: 41 },
      { group: '26-35', percentage: 45, count: 66 },
      { group: '36-45', percentage: 18, count: 26 },
      { group: '46+', percentage: 9, count: 14 }
    ]
  });

  useEffect(() => {
    refreshData();
  }, [dateRange]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchSatisfactionData(),
        fetchBusinessMetrics()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFilter = (filter: string) => {
    setQuickFilter(filter);
    const now = new Date();
    let from: Date;

    switch (filter) {
      case "7days":
        from = subDays(now, 7);
        break;
      case "30days":
        from = subDays(now, 30);
        break;
      case "3months":
        from = subMonths(now, 3);
        break;
      case "6months":
        from = subMonths(now, 6);
        break;
      case "thisMonth":
        from = startOfMonth(now);
        break;
      case "lastMonth":
        from = startOfMonth(subMonths(now, 1));
        setDateRange({ from, to: endOfMonth(subMonths(now, 1)) });
        return;
      default:
        from = subDays(now, 30);
    }
    setDateRange({ from, to: now });
  };

  const fetchSatisfactionData = async () => {
    try {
      const { data } = await supabase
        .from('feedback')
        .select('rating, emoji, created_at')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });

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

  const fetchBusinessMetrics = async () => {
    try {
      const { data } = await supabase
        .from('session_line_items')
        .select('price, quantity, user_id, created_at')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .eq('status', 'completed');

      if (data && data.length > 0) {
        const totalRevenue = data.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const avgOrder = totalRevenue / data.length;
        const uniqueCustomers = new Set(data.map(item => item.user_id)).size;
        const totalOrders = data.length;
        const repeatRate = ((totalOrders - uniqueCustomers) / totalOrders) * 100;

        setBusinessMetrics(prev => ({
          ...prev,
          avgOrderValue: Number(avgOrder.toFixed(1)),
          totalOrders: totalOrders,
          repeatCustomerRate: Number(repeatRate.toFixed(0)),
          totalRevenue: Number(totalRevenue.toFixed(0))
        }));
      }
    } catch (error) {
      console.error('Error fetching business metrics:', error);
    }
  };

  const revenueBreakdown = [
    { category: "Memberships", amount: "12,450 EGP", percentage: 45, color: "bg-primary" },
    { category: "Room Bookings", amount: "8,200 EGP", percentage: 30, color: "bg-accent" },
    { category: "Drinks & Food", amount: "4,100 EGP", percentage: 15, color: "bg-success" },
    { category: "Events", amount: "2,750 EGP", percentage: 10, color: "bg-warning" },
  ];

  const roomUtilization = [
    { room: "Meeting Room 1", utilization: 85, status: "High" },
    { room: "Meeting Room 2", utilization: 62, status: "Medium" },
    { room: "Conference Hall", utilization: 91, status: "High" },
    { room: "Private Office A", utilization: 45, status: "Low" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} size="sm" className="hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                CEO Dashboard
              </h1>
              <p className="text-muted-foreground">Advanced insights and business intelligence</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
              className="bg-background"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="bg-background">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Advanced Date Filters */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Data Filters
                </CardTitle>
                <CardDescription>
                  Showing data from {format(dateRange.from, "MMM dd, yyyy")} to {format(dateRange.to, "MMM dd, yyyy")}
                </CardDescription>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Quick Filters */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { value: "7days", label: "7 Days" },
                    { value: "30days", label: "30 Days" },
                    { value: "thisMonth", label: "This Month" },
                    { value: "lastMonth", label: "Last Month" },
                    { value: "3months", label: "3 Months" },
                    { value: "6months", label: "6 Months" }
                  ].map((filter) => (
                    <Button
                      key={filter.value}
                      variant={quickFilter === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleQuickFilter(filter.value)}
                      className="text-xs"
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>

                {/* Custom Date Range */}
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-background">
                        <CalendarIcon className="h-4 w-4" />
                        Custom Range
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border shadow-lg" align="end">
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="text-sm font-medium">From Date</label>
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                            className="pointer-events-auto"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">To Date</label>
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                            className="pointer-events-auto"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 backdrop-blur">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-background">
              <PieChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="kpis" className="data-[state=active]:bg-background">
              <BarChart3 className="h-4 w-4 mr-2" />
              KPIs
            </TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-background">
              <UserCog className="h-4 w-4 mr-2" />
              Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                title="Total Revenue" 
                value={`${businessMetrics.totalRevenue.toLocaleString()} EGP`} 
                change="+12.5%" 
                icon={DollarSign} 
                variant="success" 
              />
              <MetricCard 
                title="Active Members" 
                value={businessMetrics.activeMembers.toString()} 
                change="+8" 
                icon={Users} 
                variant="info" 
              />
              <MetricCard 
                title="Occupancy Rate" 
                value={`${businessMetrics.occupancyRate}%`} 
                change="+5.2%" 
                icon={Building} 
                variant="default" 
              />
              <MetricCard 
                title="Events This Month" 
                value={businessMetrics.eventsThisMonth.toString()} 
                change="+15%" 
                icon={Calendar} 
                variant="success" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enhanced Revenue Breakdown */}
              <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Revenue distribution by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {revenueBreakdown.map((item) => (
                      <div key={item.category} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{item.amount}</span>
                            <Badge variant="secondary" className="text-xs">
                              {item.percentage}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={item.percentage} className="h-3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Live Traffic */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle>Live Traffic</CardTitle>
                  <CardDescription>Current occupancy status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <div className="text-5xl font-bold text-primary">42</div>
                      <Badge className="absolute -top-2 -right-2 bg-green-500">
                        Live
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">People currently inside</p>
                    <Progress value={70} className="h-4" />
                    <p className="text-sm text-muted-foreground">70% capacity</p>
                    
                    <div className="pt-4 border-t space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Peak Today:</span>
                        <span className="font-medium">58 at 2:30 PM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Average:</span>
                        <span className="font-medium">45 people/day</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Room Utilization */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle>Room Utilization</CardTitle>
                  <CardDescription>Weekly utilization rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {roomUtilization.map((room) => (
                      <div key={room.room} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{room.room}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{room.utilization}%</span>
                            <Badge 
                              variant={
                                room.status === "High" ? "default" :
                                room.status === "Medium" ? "secondary" : "outline"
                              }
                              className="text-xs"
                            >
                              {room.status}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={room.utilization} className="h-3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Alerts & Notifications */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>Important notifications and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg border border-warning/20">
                      <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Low Coffee Stock</p>
                        <p className="text-xs text-muted-foreground">Only 12 units remaining</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        High
                      </Badge>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Revenue Milestone</p>
                        <p className="text-xs text-muted-foreground">Monthly target 85% achieved</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Info
                      </Badge>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Upcoming Event</p>
                        <p className="text-xs text-muted-foreground">Networking Night - 45 registered</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Low
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Enhanced Business Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard 
                title="Avg Order Value" 
                value={`${businessMetrics.avgOrderValue} EGP`} 
                change="+8.2%" 
                icon={DollarSign} 
                variant="success" 
              />
              <MetricCard 
                title="Customer Satisfaction" 
                value={`${satisfactionData.averageRating}/5`} 
                change="+0.3" 
                icon={Star} 
                variant="info" 
              />
              <MetricCard 
                title="Repeat Customer Rate" 
                value={`${businessMetrics.repeatCustomerRate}%`} 
                change="+5%" 
                icon={Users} 
                variant="success" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Satisfaction Ratings */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smile className="h-5 w-5" />
                    Customer Satisfaction
                  </CardTitle>
                  <CardDescription>
                    Based on {satisfactionData.totalFeedback} feedback responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary mb-3">
                        {satisfactionData.averageRating}
                      </div>
                      <div className="flex justify-center items-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={`h-6 w-6 ${
                              star <= Math.round(satisfactionData.averageRating) 
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <Badge variant="secondary" className="text-sm">
                        Excellent Rating
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {satisfactionData.ratingDistribution.map((item) => (
                        <div key={item.rating} className="flex items-center gap-4">
                          <span className="text-xl">{item.emoji}</span>
                          <span className="text-sm w-6">{item.rating}</span>
                          <div className="flex-1">
                            <Progress 
                              value={(item.count / satisfactionData.totalFeedback) * 100} 
                              className="h-3" 
                            />
                          </div>
                          <span className="text-sm font-medium w-10 text-right">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Demographics */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle>Customer Demographics</CardTitle>
                  <CardDescription>Age and gender distribution insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Gender Distribution */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Gender Distribution
                      </h4>
                      <div className="space-y-3">
                        {demographicData.genderDistribution.map((item) => (
                          <div key={item.gender} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.gender}</span>
                            <div className="flex items-center gap-3">
                              <Progress value={item.percentage} className="w-24 h-3" />
                              <span className="text-sm font-bold w-12 text-right">{item.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Age Groups */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Age Groups
                      </h4>
                      <div className="space-y-3">
                        {demographicData.ageGroups.map((item) => (
                          <div key={item.group} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.group}</span>
                            <div className="flex items-center gap-3">
                              <Progress value={item.percentage} className="w-24 h-3" />
                              <span className="text-sm font-bold w-12 text-right">{item.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Business Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5" />
                    Order Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Orders</span>
                      <span className="font-bold text-lg">{businessMetrics.totalOrders.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Order Value</span>
                      <span className="font-bold text-lg">{businessMetrics.avgOrderValue} EGP</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Peak Hours</span>
                      <Badge variant="outline">2-4 PM</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customer Behavior
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Repeat Rate</span>
                      <span className="font-bold text-lg">{businessMetrics.repeatCustomerRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Session</span>
                      <Badge variant="outline">3.2 hours</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Popular Day</span>
                      <Badge variant="secondary">Wednesday</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Growth Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Monthly Growth</span>
                      <Badge variant="default" className="bg-green-500">+15.2%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">New Members</span>
                      <span className="font-bold text-lg">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Churn Rate</span>
                      <Badge variant="outline" className="text-yellow-600">2.1%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="kpis" className="space-y-6">
            <KPIManagement />
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <RolesManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CeoDashboard;