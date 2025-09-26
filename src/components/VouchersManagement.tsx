import { useState } from "react";
import { Ticket, Plus, Copy, Eye, EyeOff, Calendar, DollarSign, Percent, Gift, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Voucher {
  id: string;
  code: string;
  name: string;
  type: "percentage" | "fixed" | "freeService";
  value: number;
  description: string;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdDate: string;
}

const VouchersManagement = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([
    {
      id: "1",
      code: "WELCOME20",
      name: "Welcome Discount",
      type: "percentage",
      value: 20,
      description: "20% off for new members",
      expiryDate: "2024-12-31",
      usageLimit: 100,
      usedCount: 25,
      isActive: true,
      createdDate: "2024-01-15"
    },
    {
      id: "2",
      code: "FREECOFFEE",
      name: "Free Coffee Voucher",
      type: "freeService",
      value: 0,
      description: "Free coffee for premium members",
      expiryDate: "2024-06-30",
      usageLimit: 50,
      usedCount: 12,
      isActive: true,
      createdDate: "2024-01-20"
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newVoucher, setNewVoucher] = useState<{
    name: string;
    type: "percentage" | "fixed" | "freeService";
    value: number;
    description: string;
    expiryDate: string;
    usageLimit: number;
  }>({
    name: "",
    type: "percentage",
    value: 0,
    description: "",
    expiryDate: "",
    usageLimit: 1
  });

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateVoucher = () => {
    if (!newVoucher.name || !newVoucher.description || !newVoucher.expiryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const voucher: Voucher = {
      id: Date.now().toString(),
      code: generateVoucherCode(),
      name: newVoucher.name,
      type: newVoucher.type,
      value: newVoucher.value,
      description: newVoucher.description,
      expiryDate: newVoucher.expiryDate,
      usageLimit: newVoucher.usageLimit,
      usedCount: 0,
      isActive: true,
      createdDate: new Date().toISOString().split('T')[0]
    };

    setVouchers(prev => [...prev, voucher]);
    setNewVoucher({
      name: "",
      type: "percentage",
      value: 0,
      description: "",
      expiryDate: "",
      usageLimit: 1
    });
    setIsCreateDialogOpen(false);
    toast.success("Voucher created successfully!");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Voucher code copied to clipboard!");
  };

  const toggleVoucherStatus = (id: string) => {
    setVouchers(prev => prev.map(voucher => 
      voucher.id === id ? { ...voucher, isActive: !voucher.isActive } : voucher
    ));
  };

  const deleteVoucher = (id: string) => {
    setVouchers(prev => prev.filter(voucher => voucher.id !== id));
    toast.success("Voucher deleted successfully!");
  };

  const getVoucherTypeIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return <Percent className="h-4 w-4" />;
      case "fixed":
        return <DollarSign className="h-4 w-4" />;
      case "freeService":
        return <Gift className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const getVoucherTypeLabel = (type: string) => {
    switch (type) {
      case "percentage":
        return "Percentage";
      case "fixed":
        return "Fixed Amount";
      case "freeService":
        return "Free Service";
      default:
        return "Unknown";
    }
  };

  const formatVoucherValue = (voucher: Voucher) => {
    switch (voucher.type) {
      case "percentage":
        return `${voucher.value}% OFF`;
      case "fixed":
        return `${voucher.value} EGP OFF`;
      case "freeService":
        return "FREE SERVICE";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Vouchers Management</h3>
          <p className="text-muted-foreground">Create and manage discount vouchers and promotional codes</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="professional" size="lg">
              <Plus className="h-4 w-4" />
              Create Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Voucher</DialogTitle>
              <DialogDescription>
                Generate a new voucher with custom settings and automatic code generation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="voucher-name">Voucher Name *</Label>
                <Input
                  id="voucher-name"
                  placeholder="e.g., Summer Special"
                  value={newVoucher.name}
                  onChange={(e) => setNewVoucher(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="voucher-type">Voucher Type</Label>
                <Select 
                  value={newVoucher.type} 
                  onValueChange={(value: "percentage" | "fixed" | "freeService") => 
                    setNewVoucher(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Discount</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="freeService">Free Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newVoucher.type !== "freeService" && (
                <div>
                  <Label htmlFor="voucher-value">
                    {newVoucher.type === "percentage" ? "Discount %" : "Amount (EGP)"}
                  </Label>
                  <Input
                    id="voucher-value"
                    type="number"
                    placeholder={newVoucher.type === "percentage" ? "e.g., 20" : "e.g., 50 EGP"}
                    value={newVoucher.value || ""}
                    onChange={(e) => setNewVoucher(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="voucher-description">Description *</Label>
                <Input
                  id="voucher-description"
                  placeholder="Brief description of the voucher"
                  value={newVoucher.description}
                  onChange={(e) => setNewVoucher(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="expiry-date">Expiry Date *</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={newVoucher.expiryDate}
                  onChange={(e) => setNewVoucher(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="usage-limit">Usage Limit</Label>
                <Input
                  id="usage-limit"
                  type="number"
                  placeholder="e.g., 100"
                  value={newVoucher.usageLimit || ""}
                  onChange={(e) => setNewVoucher(prev => ({ ...prev, usageLimit: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateVoucher} className="flex-1">
                  Create Voucher
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vouchers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vouchers.map((voucher) => (
          <Card key={voucher.id} className={`relative ${!voucher.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    {getVoucherTypeIcon(voucher.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{voucher.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {getVoucherTypeLabel(voucher.type)}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleVoucherStatus(voucher.id)}
                  className="h-8 w-8"
                >
                  {voucher.isActive ? 
                    <Eye className="h-4 w-4" /> : 
                    <EyeOff className="h-4 w-4" />
                  }
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <div className="font-mono text-lg font-bold">{voucher.code}</div>
                <div className="text-sm text-accent font-medium">
                  {formatVoucherValue(voucher)}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{voucher.description}</p>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Expires: {voucher.expiryDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Usage: {voucher.usedCount}/{voucher.usageLimit}</span>
                  <span>{voucher.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(voucher.code)}
                  className="flex-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteVoucher(voucher.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vouchers.length === 0 && (
        <Card className="text-center p-12">
          <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Vouchers Created</h3>
          <p className="text-muted-foreground mb-4">
            Create your first voucher to start offering discounts and promotions to your clients.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create First Voucher
          </Button>
        </Card>
      )}
    </div>
  );
};

export default VouchersManagement;