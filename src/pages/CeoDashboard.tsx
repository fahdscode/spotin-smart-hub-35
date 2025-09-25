import { ArrowLeft, TrendingUp, Users, DollarSign, Calendar, Coffee, AlertTriangle, Building, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import KPIManagement from "@/components/KPIManagement";
import { useNavigate } from "react-router-dom";

const CeoDashboard = () => {
  const navigate = useNavigate();

  const revenueBreakdown = [
    { category: "Memberships", amount: "$12,450", percentage: 45, color: "bg-primary" },
    { category: "Room Bookings", amount: "$8,200", percentage: 30, color: "bg-accent" },
    { category: "Drinks & Food", amount: "$4,100", percentage: 15, color: "bg-success" },
    { category: "Events", amount: "$2,750", percentage: 10, color: "bg-warning" },
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="kpis">
              <BarChart3 className="h-4 w-4 mr-2" />
              KPIs Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Total Revenue" value="$27,500" change="+12.5%" icon={DollarSign} variant="success" />
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

          <TabsContent value="kpis" className="space-y-6">
            <KPIManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CeoDashboard;