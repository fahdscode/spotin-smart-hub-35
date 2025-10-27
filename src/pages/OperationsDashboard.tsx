import { useState } from "react";
import { ArrowLeft, Package, DollarSign, ShoppingCart, TrendingDown, AlertTriangle, CheckCircle, XCircle, Plus, Minus, Bell, FileText, Building, Users, Calendar, Truck, Zap, Home, Users2, BarChart3, Calculator, Ticket, Ban, Download, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import PendingOrders from "@/components/PendingOrders";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import VouchersManagement from "@/components/VouchersManagement";
import DayUseTicketControls from "@/components/DayUseTicketControls";
import RoomsManagement from "@/components/RoomsManagement";
import MembershipPlansManagement from "@/components/MembershipPlansManagement";
import ProductPricing from "@/components/ProductPricing";
import ProductCategories from "@/components/ProductCategories";
import StockManagement from "@/components/StockManagement";
import IngredientUsageReport from "@/components/IngredientUsageReport";
import VendorManagement from "@/components/VendorManagement";
import BillManagement from "@/components/BillManagement";
import RolesManagement from "@/components/RolesManagement";
import CancelledReceipts from "@/components/CancelledReceipts";
import PromotionsManagement from "@/components/PromotionsManagement";
import { useNavigate } from "react-router-dom";
import { useStockData } from "@/hooks/useStockData";
import { Skeleton } from "@/components/ui/skeleton";
const OperationsDashboard = () => {
  const navigate = useNavigate();
  const {
    stockItems,
    loading,
    getCriticalStockCount,
    getTotalInventoryValue,
    getStockStatusCounts
  } = useStockData();
  const [restockAmount, setRestockAmount] = useState<{
    [key: string]: number;
  }>({});
  const [showPendingOrders, setShowPendingOrders] = useState(false);
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
  const handleRestock = (itemId: string) => {
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
  const handleGenerateStockReport = () => {
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create CSV content
    let csvContent = "Stock Report\n";
    csvContent += `Generated: ${reportDate}\n\n`;
    csvContent += "Item Name,Category,Unit,Current Quantity,Min Quantity,Status,Cost per Unit,Total Value\n";
    stockItems.forEach(item => {
      const totalValue = (item.current_quantity * (item.cost_per_unit || 0)).toFixed(2);
      csvContent += `"${item.name}","${item.category}","${item.unit}",${item.current_quantity},${item.min_quantity},"${item.status}",${item.cost_per_unit || 0},${totalValue}\n`;
    });
    csvContent += `\n\nSummary\n`;
    csvContent += `Total Items,${stockItems.length}\n`;
    csvContent += `Critical Stock,${statusCounts.critical}\n`;
    csvContent += `Low Stock,${statusCounts.low}\n`;
    csvContent += `Well Stocked,${statusCounts.good}\n`;
    csvContent += `Total Inventory Value,${getTotalInventoryValue().toFixed(2)} EGP\n`;

    // Create download
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stock-report-${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Stock report generated successfully!");
  };
  const statusCounts = getStockStatusCounts();
  return <div className="min-h-screen bg-background">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          
          <div>
            <h2 className="text-2xl font-bold text-foreground">Operations Manager</h2>
            <p className="text-muted-foreground">Stock management, inventory control, and expense tracking</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </> : <>
              <MetricCard title="Low Stock Alerts" value={getCriticalStockCount()} change={`${getCriticalStockCount()} items need attention`} icon={AlertTriangle} variant="warning" />
              <MetricCard title="Monthly Expenses" value="27,629 EGP" change="85.2% of budget" icon={DollarSign} variant="info" />
              <MetricCard title="Pending Orders" value="7" change="3 arriving today" icon={Truck} variant="default" />
              <MetricCard title="Inventory Value" value={`${getTotalInventoryValue().toLocaleString()} EGP`} change="+2.1% from last month" icon={Package} variant="success" />
            </>}
        </div>

        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList className="grid w-full grid-cols-12">
            <TabsTrigger value="stock">Stock Report</TabsTrigger>
            <TabsTrigger value="stock-mgmt">Stock Mgmt</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="usage">Usage Report</TabsTrigger>
            <TabsTrigger value="pricing">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="plans">Membership Plans</TabsTrigger>
            <TabsTrigger value="tickets">
              <Ticket className="h-4 w-4 mr-2" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="promotions">
              <Tag className="h-4 w-4 mr-2" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              <Ban className="h-4 w-4 mr-2" />
              Cancelled
            </TabsTrigger>
            <TabsTrigger value="users">User Roles</TabsTrigger>
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
                    {loading ? <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                      </div> : <div className="space-y-4">
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
                                <span>Current: {item.current_quantity} {item.unit}</span>
                                <span>Min: {item.min_quantity} {item.unit}</span>
                              </div>
                              <Progress value={item.current_quantity / item.maximum * 100} className="h-2" />
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
                      </div>}
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
                  {loading ? <div className="space-y-3">
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                    </div> : <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                        <span className="text-sm font-medium">Critical Stock</span>
                        <span className="font-bold text-destructive">
                          {statusCounts.critical}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                        <span className="text-sm font-medium">Low Stock</span>
                        <span className="font-bold text-warning">
                          {statusCounts.low}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
                        <span className="text-sm font-medium">Well Stocked</span>
                        <span className="font-bold text-success">
                          {statusCounts.good}
                        </span>
                      </div>
                    </div>}

                  <div className="border-t pt-4">
                    <Button variant="professional" className="w-full mb-2" onClick={handleGenerateStockReport}>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Stock Report
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setShowPendingOrders(true)}>
                      <Truck className="h-4 w-4 mr-2" />
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

          {/* Membership Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <MembershipPlansManagement />
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <DayUseTicketControls />
          </TabsContent>

          {/* Cancelled Receipts Tab */}
          <TabsContent value="cancelled" className="space-y-6">
            <CancelledReceipts />
          </TabsContent>

          {/* Promotions & Sales Tab */}
          <TabsContent value="promotions" className="space-y-6">
            <PromotionsManagement />
          </TabsContent>

          {/* User Roles Tab */}
          <TabsContent value="users" className="space-y-6">
            <RolesManagement />
          </TabsContent>
        </Tabs>
      </div>

      {/* Pending Orders Dialog */}
      <Dialog open={showPendingOrders} onOpenChange={setShowPendingOrders}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pending Orders</DialogTitle>
          </DialogHeader>
          <PendingOrders />
        </DialogContent>
      </Dialog>
    </div>;
};
export default OperationsDashboard;