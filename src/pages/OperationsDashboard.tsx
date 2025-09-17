import { useState } from "react";
import { ArrowLeft, Package, AlertTriangle, TrendingDown, TrendingUp, DollarSign, Truck, Zap, Home, Users2, BarChart3, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import { useNavigate } from "react-router-dom";

const OperationsDashboard = () => {
  const navigate = useNavigate();
  const [restockAmount, setRestockAmount] = useState<{[key: number]: number}>({});

  const stockItems = [
    { id: 1, name: "Coffee Beans - Premium", current: 12, minimum: 25, maximum: 100, unit: "kg", category: "Coffee", status: "low" },
    { id: 2, name: "Milk - Whole", current: 45, minimum: 20, maximum: 80, unit: "liters", category: "Dairy", status: "good" },
    { id: 3, name: "Sugar Packets", current: 150, minimum: 100, maximum: 500, unit: "pcs", category: "Supplies", status: "good" },
    { id: 4, name: "Paper Cups - Large", current: 35, minimum: 50, maximum: 300, unit: "pcs", category: "Supplies", status: "low" },
    { id: 5, name: "Tea Bags - Assorted", current: 8, minimum: 30, maximum: 150, unit: "boxes", category: "Tea", status: "critical" },
    { id: 6, name: "Sparkling Water", current: 24, minimum: 15, maximum: 60, unit: "bottles", category: "Beverages", status: "good" },
  ];

  const expenses = [
    { id: 1, category: "Rent", amount: 8500, budget: 8500, period: "Monthly", dueDate: "2024-02-01", status: "paid" },
    { id: 2, category: "Salaries", amount: 15200, budget: 16000, period: "Monthly", dueDate: "2024-01-31", status: "pending" },
    { id: 3, category: "Electricity", amount: 1250, budget: 1400, period: "Monthly", dueDate: "2024-02-05", status: "overdue" },
    { id: 4, category: "Internet", amount: 299, budget: 350, period: "Monthly", dueDate: "2024-02-10", status: "upcoming" },
    { id: 5, category: "Marketing", amount: 2100, budget: 2500, period: "Monthly", dueDate: "2024-02-15", status: "upcoming" },
    { id: 6, category: "Cleaning Supplies", amount: 180, budget: 200, period: "Monthly", dueDate: "2024-02-08", status: "upcoming" },
  ];

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "destructive";
      case "low": return "secondary";
      case "good": return "default";
      default: return "default";
    }
  };

  const getExpenseStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "pending": return "secondary";
      case "overdue": return "destructive";
      case "upcoming": return "outline";
      default: return "default";
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
      setRestockAmount(prev => ({ ...prev, [itemId]: 0 }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader />
      
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
          <MetricCard title="Monthly Expenses" value={`$${getTotalExpenses().toLocaleString()}`} change={`${((getTotalExpenses() / getTotalBudget()) * 100).toFixed(1)}% of budget`} icon={DollarSign} variant="info" />
          <MetricCard title="Pending Orders" value="7" change="3 arriving today" icon={Truck} variant="default" />
          <MetricCard title="Inventory Value" value="$12,450" change="+2.1% from last month" icon={Package} variant="success" />
        </div>

        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stock">Stock Management</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="control">Control Panel</TabsTrigger>
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
                      {stockItems.map((item) => (
                        <Card key={item.id} className={`p-4 ${item.status === "critical" ? "border-destructive bg-destructive/5" : item.status === "low" ? "border-warning bg-warning/5" : ""}`}>
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
                            <Progress value={(item.current / item.maximum) * 100} className="h-2" />
                          </div>

                          {(item.status === "critical" || item.status === "low") && (
                            <div className="flex gap-2 mt-3">
                              <Input
                                type="number"
                                placeholder="Qty to restock"
                                value={restockAmount[item.id] || ""}
                                onChange={(e) => setRestockAmount(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 0 }))}
                                className="flex-1"
                              />
                              <Button 
                                variant="accent" 
                                size="sm"
                                onClick={() => handleRestock(item.id)}
                              >
                                Order
                              </Button>
                            </div>
                          )}
                        </Card>
                      ))}
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

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Expenses</CardTitle>
                    <CardDescription>Track all operational costs and budgets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {expenses.map((expense) => (
                        <Card key={expense.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                expense.category === "Rent" ? "bg-primary/10 text-primary" :
                                expense.category === "Salaries" ? "bg-success/10 text-success" :
                                expense.category === "Electricity" ? "bg-warning/10 text-warning" :
                                expense.category === "Marketing" ? "bg-accent/10 text-accent" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {expense.category === "Rent" && <Home className="h-4 w-4" />}
                                {expense.category === "Salaries" && <Users2 className="h-4 w-4" />}
                                {expense.category === "Electricity" && <Zap className="h-4 w-4" />}
                                {expense.category === "Marketing" && <BarChart3 className="h-4 w-4" />}
                                {!["Rent", "Salaries", "Electricity", "Marketing"].includes(expense.category) && <Calculator className="h-4 w-4" />}
                              </div>
                              <div>
                                <h4 className="font-semibold">{expense.category}</h4>
                                <p className="text-sm text-muted-foreground">Due: {expense.dueDate}</p>
                              </div>
                            </div>
                            <Badge variant={getExpenseStatusColor(expense.status)}>
                              {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Amount: ${expense.amount.toLocaleString()}</span>
                              <span>Budget: ${expense.budget.toLocaleString()}</span>
                            </div>
                            <Progress value={(expense.amount / expense.budget) * 100} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {((expense.amount / expense.budget) * 100).toFixed(1)}% of budget used
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Expense Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Overview</CardTitle>
                  <CardDescription>Budget tracking and alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-foreground">
                      ${getTotalExpenses().toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Monthly Expenses</p>
                    <Progress value={(getTotalExpenses() / getTotalBudget()) * 100} className="h-3" />
                    <p className="text-xs text-muted-foreground">
                      {((getTotalExpenses() / getTotalBudget()) * 100).toFixed(1)}% of total budget
                    </p>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Fixed Costs:</span>
                      <span className="font-medium">$24,199</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Variable Costs:</span>
                      <span className="font-medium">$3,330</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Remaining Budget:</span>
                      <span className="font-medium text-success">
                        ${(getTotalBudget() - getTotalExpenses()).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Button variant="professional" className="w-full mb-2">
                      <DollarSign className="h-4 w-4" />
                      Financial Report
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Calculator className="h-4 w-4" />
                      Add Expense
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Control Panel Tab */}
          <TabsContent value="control" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Controls</CardTitle>
                  <CardDescription>Advanced operational controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="card" className="h-20 flex-col">
                      <Package className="h-6 w-6 mb-2" />
                      <span className="text-sm">Bulk Restock</span>
                    </Button>
                    <Button variant="card" className="h-20 flex-col">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      <span className="text-sm">Usage Analytics</span>
                    </Button>
                    <Button variant="card" className="h-20 flex-col">
                      <AlertTriangle className="h-6 w-6 mb-2" />
                      <span className="text-sm">Alert Settings</span>
                    </Button>
                    <Button variant="card" className="h-20 flex-col">
                      <Truck className="h-6 w-6 mb-2" />
                      <span className="text-sm">Supplier Portal</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest operational updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Low Stock Alert</p>
                        <p className="text-xs text-muted-foreground">Coffee beans below minimum threshold</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
                      <Truck className="h-4 w-4 text-success mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Delivery Completed</p>
                        <p className="text-xs text-muted-foreground">Milk and sugar supplies delivered</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-info/10 rounded-lg">
                      <DollarSign className="h-4 w-4 text-info mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Payment Processed</p>
                        <p className="text-xs text-muted-foreground">Monthly rent payment completed</p>
                        <p className="text-xs text-muted-foreground">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OperationsDashboard;