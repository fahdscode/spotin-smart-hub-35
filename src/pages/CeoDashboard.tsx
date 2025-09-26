import { ArrowLeft, TrendingUp, Users, DollarSign, Calendar, Coffee, AlertTriangle, Building, BarChart3, UserCog, Star, Smile, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import KPIManagement from "@/components/KPIManagement";
import RolesManagement from "@/components/RolesManagement";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const CeoDashboard = () => {
  const navigate = useNavigate();

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
    repeatCustomerRate: 68
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
    fetchSatisfactionData();
    fetchBusinessMetrics();
    // Mock demographic data - in real implementation, this would come from client profiles
  }, []);

  const fetchSatisfactionData = async () => {
    try {
      const { data } = await supabase
        .from('feedback')
        .select('rating, emoji, created_at')
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
        .select('price, quantity, user_id')
        .eq('status', 'completed');

      if (data && data.length > 0) {
        const totalRevenue = data.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const avgOrder = totalRevenue / data.length;
        const uniqueCustomers = new Set(data.map(item => item.user_id)).size;
        const totalOrders = data.length;
        const repeatRate = ((totalOrders - uniqueCustomers) / totalOrders) * 100;

        setBusinessMetrics({
          avgOrderValue: Number(avgOrder.toFixed(1)),
          totalOrders: totalOrders,
          repeatCustomerRate: Number(repeatRate.toFixed(0))
        });
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
    <div className="min-h-screen bg-background">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">CEO Dashboard</h2>
            <p className="text-muted-foreground">Advanced insights and business intelligence</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">
              <PieChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="kpis">
              <BarChart3 className="h-4 w-4 mr-2" />
              KPIs Management
            </TabsTrigger>
            <TabsTrigger value="roles">
              <UserCog className="h-4 w-4 mr-2" />
              Roles Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Total Revenue" value="27,500 EGP" change="+12.5%" icon={DollarSign} variant="success" />
          <MetricCard title="Active Members" value="147" change="+8" icon={Users} variant="info" />
          <MetricCard title="Occupancy Rate" value="78%" change="+5.2%" icon={Building} variant="default" />
          <MetricCard title="Events This Month" value="23" change="+15%" icon={Calendar} variant="success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Monthly revenue by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {revenueBreakdown.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.category}</span>
                      <span className="text-sm font-bold">{item.amount}</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live Traffic */}
          <Card>
            <CardHeader>
              <CardTitle>Live Traffic</CardTitle>
              <CardDescription>Current occupancy status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-primary">42</div>
                <p className="text-muted-foreground">People currently inside</p>
                <Progress value={70} className="h-3" />
                <p className="text-sm text-muted-foreground">70% capacity</p>
                
                <div className="pt-4 border-t space-y-2">
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
          {/* Room Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Room Utilization</CardTitle>
              <CardDescription>Weekly utilization rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roomUtilization.map((room) => (
                  <div key={room.room} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{room.room}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{room.utilization}%</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          room.status === "High" ? "bg-success/10 text-success" :
                          room.status === "Medium" ? "bg-warning/10 text-warning" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {room.status}
                        </span>
                      </div>
                    </div>
                    <Progress value={room.utilization} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts & Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Important notifications and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Low Coffee Stock</p>
                    <p className="text-xs text-muted-foreground">Only 12 units remaining</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-info/10 rounded-lg border border-info/20">
                  <TrendingUp className="h-5 w-5 text-info mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Revenue Milestone</p>
                    <p className="text-xs text-muted-foreground">Monthly target 85% achieved</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
                  <Calendar className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Upcoming Event</p>
                    <p className="text-xs text-muted-foreground">Networking Night - 45 registered</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Enhanced Business Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              {/* Satisfaction Ratings */}
              <Card>
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
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {satisfactionData.averageRating}
                      </div>
                      <div className="flex justify-center items-center gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(satisfactionData.averageRating) 
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {satisfactionData.ratingDistribution.map((item) => (
                        <div key={item.rating} className="flex items-center gap-3">
                          <span className="text-lg">{item.emoji}</span>
                          <span className="text-sm w-8">{item.rating}</span>
                          <div className="flex-1">
                            <Progress 
                              value={(item.count / satisfactionData.totalFeedback) * 100} 
                              className="h-2" 
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Demographics */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Demographics</CardTitle>
                  <CardDescription>Age and gender distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Gender Distribution */}
                    <div>
                      <h4 className="font-medium mb-3">Gender Distribution</h4>
                      <div className="space-y-2">
                        {demographicData.genderDistribution.map((item) => (
                          <div key={item.gender} className="flex items-center justify-between">
                            <span className="text-sm">{item.gender}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={item.percentage} className="w-20 h-2" />
                              <span className="text-sm font-medium w-8">{item.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Age Groups */}
                    <div>
                      <h4 className="font-medium mb-3">Age Groups</h4>
                      <div className="space-y-2">
                        {demographicData.ageGroups.map((item) => (
                          <div key={item.group} className="flex items-center justify-between">
                            <span className="text-sm">{item.group}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={item.percentage} className="w-20 h-2" />
                              <span className="text-sm font-medium w-8">{item.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Business Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Orders</span>
                      <span className="font-medium">{businessMetrics.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Order Value</span>
                      <span className="font-medium">{businessMetrics.avgOrderValue} EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Peak Hours</span>
                      <span className="font-medium">2-4 PM</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Behavior</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Repeat Rate</span>
                      <span className="font-medium">{businessMetrics.repeatCustomerRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg Session</span>
                      <span className="font-medium">3.2 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Popular Day</span>
                      <span className="font-medium">Wednesday</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Growth Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Growth</span>
                      <span className="font-medium text-success">+15.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">New Members</span>
                      <span className="font-medium">23 this month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Churn Rate</span>
                      <span className="font-medium text-warning">2.1%</span>
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