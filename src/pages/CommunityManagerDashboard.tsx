import { useState } from "react";
import { Calendar, Users, Ticket, TrendingUp, Plus, Eye, Edit, QrCode } from "lucide-react";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Event {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  capacity: number;
  price: number;
  ticketsSold: number;
  status: "draft" | "published" | "ongoing" | "completed";
  description?: string;
  revenue: number;
}

const CommunityManagerDashboard = () => {
  const [events, setEvents] = useState<Event[]>([
    {
      id: "EVT-001",
      title: "Tech Talk: AI in Workplace",
      category: "Workshop",
      date: "2024-01-15",
      time: "18:00",
      capacity: 50,
      price: 25,
      ticketsSold: 32,
      status: "published",
      description: "Learn how AI is transforming modern workplaces",
      revenue: 800
    },
    {
      id: "EVT-002", 
      title: "Networking Happy Hour",
      category: "Networking",
      date: "2024-01-18",
      time: "17:30",
      capacity: 80,
      price: 15,
      ticketsSold: 67,
      status: "published",
      revenue: 1005
    },
    {
      id: "EVT-003",
      title: "Startup Pitch Night",
      category: "Competition",
      date: "2024-01-22",
      time: "19:00",
      capacity: 60,
      price: 20,
      ticketsSold: 8,
      status: "draft",
      revenue: 160
    }
  ]);

  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    category: "",
    date: "",
    time: "",
    capacity: "",
    price: "",
    description: ""
  });

  const totalRevenue = events.reduce((sum, event) => sum + event.revenue, 0);
  const totalTicketsSold = events.reduce((sum, event) => sum + event.ticketsSold, 0);
  const upcomingEvents = events.filter(event => event.status === "published").length;
  const averageAttendance = events.length > 0 ? Math.round(events.reduce((sum, event) => sum + (event.ticketsSold / event.capacity * 100), 0) / events.length) : 0;

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800 border-gray-200";
      case "published": return "bg-blue-100 text-blue-800 border-blue-200";
      case "ongoing": return "bg-green-100 text-green-800 border-green-200";
      case "completed": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleCreateEvent = () => {
    const event: Event = {
      id: `EVT-${String(events.length + 1).padStart(3, '0')}`,
      title: newEvent.title,
      category: newEvent.category,
      date: newEvent.date,
      time: newEvent.time,
      capacity: parseInt(newEvent.capacity),
      price: parseFloat(newEvent.price),
      ticketsSold: 0,
      status: "draft",
      description: newEvent.description,
      revenue: 0
    };
    
    setEvents([...events, event]);
    setNewEvent({
      title: "",
      category: "",
      date: "",
      time: "",
      capacity: "",
      price: "",
      description: ""
    });
    setIsCreateEventOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader />
      
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Community Manager</h1>
            <p className="text-muted-foreground">Create and manage events, track attendance and revenue</p>
          </div>
          <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
            <DialogTrigger asChild>
              <Button variant="professional" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new community event
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input 
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newEvent.category} onValueChange={(value) => setNewEvent({...newEvent, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Workshop">Workshop</SelectItem>
                      <SelectItem value="Networking">Networking</SelectItem>
                      <SelectItem value="Competition">Competition</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input 
                      id="time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input 
                      id="capacity"
                      type="number"
                      value={newEvent.capacity}
                      onChange={(e) => setNewEvent({...newEvent, capacity: e.target.value})}
                      placeholder="Max attendees"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (€)</Label>
                    <Input 
                      id="price"
                      type="number"
                      step="0.01"
                      value={newEvent.price}
                      onChange={(e) => setNewEvent({...newEvent, price: e.target.value})}
                      placeholder="Ticket price"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Event description..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateEventOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent} variant="professional">
                  Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={`€${totalRevenue.toLocaleString()}`}
            icon={TrendingUp}
            variant="success"
          />
          <MetricCard
            title="Tickets Sold"
            value={totalTicketsSold.toString()}
            icon={Ticket}
            variant="info"
          />
          <MetricCard
            title="Upcoming Events"
            value={upcomingEvents.toString()}
            icon={Calendar}
            variant="default"
          />
          <MetricCard
            title="Avg. Attendance"
            value={`${averageAttendance}%`}
            icon={Users}
            variant="default"
          />
        </div>

        {/* Events Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Events Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Events ({events.length})</TabsTrigger>
                <TabsTrigger value="published">Published ({events.filter(e => e.status === "published").length})</TabsTrigger>
                <TabsTrigger value="draft">Drafts ({events.filter(e => e.status === "draft").length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4 mt-6">
                {events.map((event) => (
                  <div key={event.id} className="p-6 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{event.title}</h3>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                          <span className="bg-muted px-2 py-1 rounded text-xs font-medium">{event.category}</span>
                          <span>{event.date} at {event.time}</span>
                          <span>€{event.price} per ticket</span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-muted p-3 rounded">
                        <div className="text-2xl font-bold text-primary">{event.ticketsSold}</div>
                        <div className="text-sm text-muted-foreground">Tickets Sold</div>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <div className="text-2xl font-bold">{event.capacity}</div>
                        <div className="text-sm text-muted-foreground">Capacity</div>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <div className="text-2xl font-bold text-accent">€{event.revenue}</div>
                        <div className="text-sm text-muted-foreground">Revenue</div>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <div className="text-2xl font-bold text-success">
                          {Math.round((event.ticketsSold / event.capacity) * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Sold Rate</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Edit Event
                      </Button>
                      {event.status === "published" && (
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          Generate QR
                        </Button>
                      )}
                      {event.status === "draft" && (
                        <Button variant="professional" size="sm">
                          Publish Event
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="published" className="space-y-4 mt-6">
                {events.filter(event => event.status === "published").map((event) => (
                  <div key={event.id} className="p-6 border rounded-lg bg-card border-primary/20">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{event.title}</h3>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                          <span className="bg-muted px-2 py-1 rounded text-xs font-medium">{event.category}</span>
                          <span>{event.date} at {event.time}</span>
                          <span>€{event.price} per ticket</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-muted p-3 rounded">
                        <div className="text-2xl font-bold text-primary">{event.ticketsSold}</div>
                        <div className="text-sm text-muted-foreground">Tickets Sold</div>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <div className="text-2xl font-bold">{event.capacity}</div>
                        <div className="text-sm text-muted-foreground">Capacity</div>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <div className="text-2xl font-bold text-accent">€{event.revenue}</div>
                        <div className="text-sm text-muted-foreground">Revenue</div>
                      </div>
                      <div className="bg-muted p-3 rounded">
                        <div className="text-2xl font-bold text-success">
                          {Math.round((event.ticketsSold / event.capacity) * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Sold Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="draft" className="space-y-4 mt-6">
                {events.filter(event => event.status === "draft").map((event) => (
                  <div key={event.id} className="p-6 border rounded-lg bg-card border-muted">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{event.title}</h3>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                          <span className="bg-muted px-2 py-1 rounded text-xs font-medium">{event.category}</span>
                          <span>{event.date} at {event.time}</span>
                          <span>€{event.price} per ticket</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="professional" size="sm">
                        Publish Event
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Edit Draft
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityManagerDashboard;