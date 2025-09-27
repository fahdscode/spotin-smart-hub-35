import { useState } from "react";
import { Package, TrendingDown, TrendingUp, AlertCircle, Search, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MetricCard from "@/components/MetricCard";
import { useStockData } from "@/hooks/useStockData";
import type { StockItemWithStatus } from "@/hooks/useStockData";

const StockReports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { stockItems, loading, error } = useStockData();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading stock data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Error loading stock data: {error}</p>
      </div>
    );
  }

  const getStatusColor = (status: StockItemWithStatus["status"]) => {
    switch (status) {
      case "good": return "bg-success/10 text-success border-success/20";
      case "low": return "bg-warning/10 text-warning border-warning/20";
      case "critical": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground border-muted";
    }
  };

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalItems = stockItems.length;
  const lowStockItems = stockItems.filter(item => item.status === "low" || item.status === "critical").length;
  const outOfStockItems = stockItems.filter(item => item.status === "critical").length;
  const totalValue = stockItems.reduce((sum, item) => sum + (item.current_quantity * item.cost_per_unit), 0);

  return (
    <div className="space-y-6">
      {/* Stock Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Items"
          value={totalItems.toString()}
          icon={Package}
          variant="default"
        />
        <MetricCard
          title="Low Stock"
          value={lowStockItems.toString()}
          icon={TrendingDown}
          variant="warning"
        />
        <MetricCard
          title="Out of Stock"
          value={outOfStockItems.toString()}
          icon={AlertCircle}
          variant="warning"
        />
        <MetricCard
          title="Total Value"
          value={`${totalValue.toLocaleString()} EGP`}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Stock Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Beverages">Beverages</SelectItem>
                <SelectItem value="Furniture">Furniture</SelectItem>
                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="professional">
              Export Report
            </Button>
          </div>

          {/* Stock Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min/Max</TableHead>
                  <TableHead>Cost per Unit</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                     <TableCell className="font-medium">
                       <div>
                         <div className="font-semibold">{item.name}</div>
                         <div className="text-xs text-muted-foreground">{item.id}</div>
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge variant="outline">{item.category}</Badge>
                     </TableCell>
                     <TableCell>
                       <div className="font-medium">{item.current_quantity} {item.unit}</div>
                     </TableCell>
                     <TableCell>
                       <div className="text-sm">
                         <div>Min: {item.min_quantity}</div>
                         <div>Max: {item.maximum}</div>
                       </div>
                     </TableCell>
                     <TableCell>€{item.cost_per_unit.toFixed(2)}</TableCell>
                     <TableCell className="font-medium">
                       €{(item.current_quantity * item.cost_per_unit).toFixed(2)}
                     </TableCell>
                     <TableCell>
                       <Badge className={getStatusColor(item.status)}>
                         {item.status.replace("-", " ")}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       <div className="text-sm">
                         <div>{item.supplier || 'No supplier'}</div>
                         <div className="text-xs text-muted-foreground">Updated: {new Date(item.updated_at).toLocaleDateString()}</div>
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockReports;