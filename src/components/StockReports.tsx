import { useState } from "react";
import { Package, TrendingDown, TrendingUp, AlertCircle, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MetricCard from "@/components/MetricCard";

interface StockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  lastUpdated: string;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

const StockReports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const stockItems: StockItem[] = [
    {
      id: "STK-001",
      name: "Coffee Beans - Arabica",
      category: "Beverages",
      currentStock: 25,
      minStock: 10,
      maxStock: 100,
      unit: "kg",
      costPerUnit: 15.50,
      supplier: "Premium Coffee Co.",
      lastUpdated: "2024-01-15",
      status: "in-stock"
    },
    {
      id: "STK-002",
      name: "Meeting Room Chairs",
      category: "Furniture",
      currentStock: 5,
      minStock: 8,
      maxStock: 20,
      unit: "pieces",
      costPerUnit: 85.00,
      supplier: "Office Solutions Ltd.",
      lastUpdated: "2024-01-14",
      status: "low-stock"
    },
    {
      id: "STK-003",
      name: "Printer Paper A4",
      category: "Office Supplies",
      currentStock: 0,
      minStock: 5,
      maxStock: 50,
      unit: "reams",
      costPerUnit: 4.20,
      supplier: "Stationery Plus",
      lastUpdated: "2024-01-13",
      status: "out-of-stock"
    },
    {
      id: "STK-004",
      name: "Projector Bulbs",
      category: "Electronics",
      currentStock: 8,
      minStock: 3,
      maxStock: 15,
      unit: "pieces",
      costPerUnit: 125.00,
      supplier: "Tech Components Inc.",
      lastUpdated: "2024-01-15",
      status: "in-stock"
    }
  ];

  const getStatusColor = (status: StockItem["status"]) => {
    switch (status) {
      case "in-stock": return "bg-success/10 text-success border-success/20";
      case "low-stock": return "bg-warning/10 text-warning border-warning/20";
      case "out-of-stock": return "bg-destructive/10 text-destructive border-destructive/20";
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
  const lowStockItems = stockItems.filter(item => item.status === "low-stock").length;
  const outOfStockItems = stockItems.filter(item => item.status === "out-of-stock").length;
  const totalValue = stockItems.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);

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
                      <div className="font-medium">{item.currentStock} {item.unit}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Min: {item.minStock}</div>
                        <div>Max: {item.maxStock}</div>
                      </div>
                    </TableCell>
                    <TableCell>€{item.costPerUnit.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">
                      €{(item.currentStock * item.costPerUnit).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{item.supplier}</div>
                        <div className="text-xs text-muted-foreground">Updated: {item.lastUpdated}</div>
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