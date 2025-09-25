import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Building, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Room {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  hourly_rate: number;
  is_available: boolean;
  amenities: string[];
  image_url: string | null;
  created_at: string;
}

const RoomsManagement = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: 1,
    hourly_rate: 0,
    is_available: true,
    amenities: "",
    image_url: ""
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amenitiesArray = formData.amenities.split(',').map(a => a.trim()).filter(a => a);
      
      const roomData = {
        name: formData.name,
        description: formData.description || null,
        capacity: formData.capacity,
        hourly_rate: formData.hourly_rate,
        is_available: formData.is_available,
        amenities: amenitiesArray,
        image_url: formData.image_url || null
      };

      if (editingRoom) {
        const { error } = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', editingRoom.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Room updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('rooms')
          .insert([roomData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Room created successfully",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description || "",
      capacity: room.capacity,
      hourly_rate: room.hourly_rate,
      is_available: room.is_available,
      amenities: room.amenities.join(', '),
      image_url: room.image_url || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Room deleted successfully",
      });
      
      fetchRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      capacity: 1,
      hourly_rate: 0,
      is_available: true,
      amenities: "",
      image_url: ""
    });
    setEditingRoom(null);
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && rooms.length === 0) {
    return <div>Loading rooms...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rooms Management</CardTitle>
              <CardDescription>Manage workspace rooms and meeting spaces</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} variant="professional">
                  <Plus className="h-4 w-4" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
                  <DialogDescription>
                    {editingRoom ? 'Update room details' : 'Create a new workspace room'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Room Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Conference Room A"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Room description and features"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                    <Input
                      id="amenities"
                      value={formData.amenities}
                      onChange={(e) => setFormData(prev => ({ ...prev, amenities: e.target.value }))}
                      placeholder="e.g., Projector, Whiteboard, Wi-Fi"
                    />
                  </div>

                  <div>
                    <Label htmlFor="image_url">Image URL (optional)</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/room-image.jpg"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_available"
                      checked={formData.is_available}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                    />
                    <Label htmlFor="is_available">Available for booking</Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Saving...' : editingRoom ? 'Update Room' : 'Create Room'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />

            <div className="grid gap-4">
              {filteredRooms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No rooms match your search.' : 'No rooms found. Create your first room!'}
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <Card key={room.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Building className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">{room.name}</h3>
                          <Badge variant={room.is_available ? "default" : "secondary"}>
                            {room.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                        
                        {room.description && (
                          <p className="text-muted-foreground mb-3">{room.description}</p>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{room.capacity} people</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>${room.hourly_rate}/hour</span>
                          </div>
                        </div>
                        
                        {room.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {room.amenities.map((amenity, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(room)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(room.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomsManagement;