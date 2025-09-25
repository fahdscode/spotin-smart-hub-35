import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Phone, Mail, MapPin, Plus, Edit3, Trash2, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Vendor {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const VendorManagement = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    is_active: true
  });
  const { toast } = useToast();

  // Mock vendors if no real data
  const mockVendors: Vendor[] = [
    {
      id: '1',
      name: 'Fresh Coffee Supplies',
      contact_email: 'orders@freshcoffee.com',
      contact_phone: '+1 555-0123',
      address: '123 Coffee Street, Bean City, BC 12345',
      is_active: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Office Equipment Plus',
      contact_email: 'sales@officeplus.com',
      contact_phone: '+1 555-0456',
      address: '456 Supply Avenue, Office Park, OP 67890',
      is_active: true,
      created_at: '2024-02-01T14:30:00Z',
      updated_at: '2024-02-01T14:30:00Z'
    },
    {
      id: '3',
      name: 'Green Energy Solutions',
      contact_email: 'info@greenenergy.com',
      contact_phone: '+1 555-0789',
      address: '789 Eco Lane, Green Valley, GV 11111',
      is_active: false,
      created_at: '2024-03-10T09:15:00Z',
      updated_at: '2024-03-10T09:15:00Z'
    }
  ];

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Use real data if available, otherwise use mock data
      setVendors(data && data.length > 0 ? data : mockVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors(mockVendors); // Use mock data on error
      toast({
        title: "Loading Mock Data",
        description: "Using sample vendor data for demonstration.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingVendor) {
        // Update existing vendor
        const { error } = await supabase
          .from('vendors')
          .update(vendorForm)
          .eq('id', editingVendor.id);

        if (error) throw error;

        toast({
          title: "Vendor Updated",
          description: "Vendor information has been updated successfully.",
        });
      } else {
        // Create new vendor
        const { error } = await supabase
          .from('vendors')
          .insert(vendorForm);

        if (error) throw error;

        toast({
          title: "Vendor Created",
          description: "New vendor has been added successfully.",
        });
      }

      // Reset form and close dialog
      setVendorForm({ name: '', contact_email: '', contact_phone: '', address: '', is_active: true });
      setIsAddingVendor(false);
      setEditingVendor(null);
      fetchVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast({
        title: "Error",
        description: "Failed to save vendor. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: "Vendor Deleted",
        description: "Vendor has been removed successfully.",
      });
      fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to delete vendor. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      name: vendor.name,
      contact_email: vendor.contact_email || '',
      contact_phone: vendor.contact_phone || '',
      address: vendor.address || '',
      is_active: vendor.is_active
    });
    setIsAddingVendor(true);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.contact_phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && vendor.is_active) ||
                         (statusFilter === 'inactive' && !vendor.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Vendor Management
            </CardTitle>
            <CardDescription>
              Manage your suppliers and vendors
            </CardDescription>
          </div>
          <Dialog open={isAddingVendor} onOpenChange={setIsAddingVendor}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingVendor(null);
                setVendorForm({ name: '', contact_email: '', contact_phone: '', address: '', is_active: true });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
                <DialogDescription>
                  {editingVendor ? 'Update vendor information' : 'Create a new vendor record'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitVendor} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input
                    id="name"
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={vendorForm.contact_email}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input
                    id="phone"
                    value={vendorForm.contact_phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={vendorForm.address}
                    onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={vendorForm.is_active ? 'active' : 'inactive'} 
                    onValueChange={(value) => setVendorForm({ ...vendorForm, is_active: value === 'active' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingVendor ? 'Update' : 'Create'} Vendor
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddingVendor(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vendors List */}
        <div className="space-y-4">
          {filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No vendors found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filter' : 'Add your first vendor to get started'}
              </p>
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <Card key={vendor.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{vendor.name}</h3>
                      <Badge variant={vendor.is_active ? 'default' : 'secondary'}>
                        {vendor.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {vendor.contact_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{vendor.contact_email}</span>
                        </div>
                      )}
                      {vendor.contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{vendor.contact_phone}</span>
                        </div>
                      )}
                      {vendor.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-2">{vendor.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditVendor(vendor)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteVendor(vendor.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorManagement;