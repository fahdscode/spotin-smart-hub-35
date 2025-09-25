import { useState } from "react";
import { ArrowLeft, Package, DollarSign, ShoppingCart, TrendingDown, AlertTriangle, CheckCircle, XCircle, Plus, Minus, Bell, FileText, Building, Users, Calendar, Truck, Zap, Home, Users2, BarChart3, Calculator, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import VouchersManagement from "@/components/VouchersManagement";
import DayUseTicketControls from "@/components/DayUseTicketControls";
import MembershipManagement from "@/components/MembershipManagement";
import RoomsManagement from "@/components/RoomsManagement";
import MembershipPlansManagement from "@/components/MembershipPlansManagement";
import ProductPricing from "@/components/ProductPricing";
import ProductCategories from "@/components/ProductCategories";
import StockManagement from "@/components/StockManagement";
import IngredientUsageReport from "@/components/IngredientUsageReport";
import VendorManagement from "@/components/VendorManagement";
import BillManagement from "@/components/BillManagement";
import { useNavigate } from "react-router-dom";
const OperationsDashboard = () => {
  const navigate = useNavigate();
  const [restockAmount, setRestockAmount] = useState<{
    [key: number]: number;
  }>({});
  const stockItems = [{
    id: 1,
    name: "Coffee Beans - Premium",
    current: 12,
    minimum: 25,
    maximum: 100,
    unit: "kg",
    category: "Coffee",
    status: "low"
  }, {
    id: 2,
    name: "Milk - Whole",
    current: 45,
    minimum: 20,
    maximum: 80,
    unit: "liters",
    category: "Dairy",
    status: "good"
  }, {
    id: 3,
    name: "Sugar",
    current: 15,
    minimum: 10,
    maximum: 50,
    unit: "kg",
    category: "Ingredients",
    status: "good"
  }, {
    id: 4,
    name: "Flour",
    current: 8,
    minimum: 12,
    maximum: 40,
    unit: "kg",
    category: "Ingredients",
    status: "low"
  }, {
    id: 5,
    name: "Tea Leaves - Assorted",
    current: 2.8,
    minimum: 5,
    maximum: 20,
    unit: "kg",
    category: "Tea",
    status: "critical"
  }, {
    id: 6,
    name: "Cocoa Powder",
    current: 1.2,
    minimum: 2,
    maximum: 10,
    unit: "kg",
    category: "Ingredients",
    status: "critical"
  }, {
    id: 7,
    name: "Butter",
    current: 3.5,
    minimum: 3,
    maximum: 15,
    unit: "kg",
    category: "Dairy",
    status: "good"
  }, {
    id: 8,
    name: "Eggs",
    current: 24,
    minimum: 36,
    maximum: 100,
    unit: "dozen",
    category: "Dairy",
    status: "low"
  }];
  const expenses = [{
    id: 1,
    category: "Rent",
    amount: 8500,
    budget: 8500,
    period: "Monthly",
    dueDate: "2024-02-01",
    status: "paid"
  }, {
    id: 2,
    category: "Salaries",
    amount: 15200,
    budget: 16000,
    period: "Monthly",
    dueDate: "2024-01-31",
    status: "pending"
  }, {
    id: 3,
    category: "Electricity",
    amount: 1250,
    budget: 1400,
    period: "Monthly",
    dueDate: "2024-02-05",
    status: "overdue"
  }, {
    id: 4,
    category: "Internet",
    amount: 299,
    budget: 350,
    period: "Monthly",
    dueDate: "2024-02-10",
    status: "upcoming"
  }, {
    id: 5,
    category: "Marketing",
    amount: 2100,
    budget: 2500,
    period: "Monthly",
    dueDate: "2024-02-15",
    status: "upcoming"
  }, {
    id: 6,
    category: "Cleaning Supplies",
    amount: 180,
    budget: 200,
    period: "Monthly",
    dueDate: "2024-02-08",
    status: "upcoming"
  }];
  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "destructive";
      case "low":
        return "secondary";
      case "good":
        return "default";
      default:
        return "default";
    }
  };
  const getExpenseStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "overdue":
        return "destructive";
      case "upcoming":
        return "outline";
      default:
        return "default";
    }
  };
  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };
  const getTotalBudget = () => {
    return expenses.reduce((total, expense) => total + expense.budget, 0);
  };
  const getCriticalStockCount = () => {
    return stockItems.filter(item => item.status === "critical" || item.status === "low").length;
  };
  const handleRestock = (itemId: number) => {
    const amount = restockAmount[itemId];
    if (amount && amount > 0) {
      // In a real app, this would make an API call
      alert(`Restocking ${amount} units for item ${itemId}`);
      setRestockAmount(prev => ({
        ...prev,
        [itemId]: 0
      }));
    }
  };
  return <div className="min-h-screen bg-background">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Operations Manager</h2>
            <p className="text-muted-foreground">Stock management, inventory control, and expense tracking</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Low Stock Alerts" value={getCriticalStockCount()} change={`${getCriticalStockCount()} items need attention`} icon={AlertTriangle} variant="warning" />
          <MetricCard title="Monthly Expenses" value={`$${getTotalExpenses().toLocaleString()}`} change={`${(getTotalExpenses() / getTotalBudget() * 100).toFixed(1)}% of budget`} icon={DollarSign} variant="info" />
          <MetricCard title="Pending Orders" value="7" change="3 arriving today" icon={Truck} variant="default" />
          <MetricCard title="Inventory Value" value="$12,450" change="+2.1% from last month" icon={Package} variant="success" />
        </div>

        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="stock">Stock Report</TabsTrigger>
            <TabsTrigger value="stock-mgmt">Stock Mgmt</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="usage">Usage Report</TabsTrigger>
            <TabsTrigger value="pricing">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
          </TabsList>

          {/* Stock Management Tab */}
          <TabsContent value="stock" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Levels</CardTitle>
                    <CardDescription>Current stock status and reorder alerts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stockItems.map(item => <Card key={item.id} className={`p-4 ${item.status === "critical" ? "border-destructive bg-destructive/5" : item.status === "low" ? "border-warning bg-warning/5" : ""}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                            </div>
                            <Badge variant={getStockStatusColor(item.status)}>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Current: {item.current} {item.unit}</span>
                              <span>Min: {item.minimum} {item.unit}</span>
                            </div>
                            <Progress value={item.current / item.maximum * 100} className="h-2" />
                          </div>

                          {(item.status === "critical" || item.status === "low") && <div className="flex gap-2 mt-3">
                              <Input type="number" placeholder="Qty to restock" value={restockAmount[item.id] || ""} onChange={e => setRestockAmount(prev => ({
                          ...prev,
                          [item.id]: parseInt(e.target.value) || 0
                        }))} className="flex-1" />
                              <Button variant="accent" size="sm" onClick={() => handleRestock(item.id)}>
                                Order
                              </Button>
                            </div>}
                        </Card>)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stock Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock Summary</CardTitle>
                  <CardDescription>Overall inventory status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <span className="text-sm font-medium">Critical Stock</span>
                      <span className="font-bold text-destructive">
                        {stockItems.filter(item => item.status === "critical").length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <span className="text-sm font-medium">Low Stock</span>
                      <span className="font-bold text-warning">
                        {stockItems.filter(item => item.status === "low").length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
                      <span className="text-sm font-medium">Well Stocked</span>
                      <span className="font-bold text-success">
                        {stockItems.filter(item => item.status === "good").length}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Button variant="professional" className="w-full mb-2">
                      <Package className="h-4 w-4" />
                      Generate Stock Report
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Truck className="h-4 w-4" />
                      View Pending Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stock Management Tab */}
          <TabsContent value="stock-mgmt" className="space-y-6">
            <StockManagement />
          </TabsContent>

          {/* Vendor Management Tab */}
          <TabsContent value="vendors" className="space-y-6">
            <VendorManagement />
          </TabsContent>

          {/* Bill Management Tab */}
          <TabsContent value="bills" className="space-y-6">
            <BillManagement />
          </TabsContent>

          {/* Ingredient Usage Report Tab */}
          <TabsContent value="usage" className="space-y-6">
            <IngredientUsageReport />
          </TabsContent>

          {/* Product Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <ProductPricing />
          </TabsContent>

          {/* Product Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <ProductCategories />
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-6">
            <RoomsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default OperationsDashboard;