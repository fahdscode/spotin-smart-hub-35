import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Plus, Edit, Trash2, Users, Clock, MapPin, DollarSign, Mail, Phone, CheckCircle, XCircle, AlertCircle, Target, Download, Filter, Search, FileText, FileSpreadsheet, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import SpotinHeader from "@/components/SpotinHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  capacity: number;
  registered_attendees: number;
  price: number;
  category: string;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
}
interface EventFormData {
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  price: number;
  category: string;
}
interface EventRegistration {
  id: string;
  event_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  client_id: string | null;
  registration_date: string;
  special_requests: string | null;
  attendance_status: 'registered' | 'attended' | 'no_show' | 'cancelled';
  events?: Event;
}
interface EventAnalytics {
  total_events: number;
  total_registrations: number;
  total_revenue: number;
  avg_attendance_rate: number;
  popular_categories: Array<{
    category: string;
    count: number;
    registrations: number;
  }>;
  monthly_stats: Array<{
    month: string;
    events: number;
    registrations: number;
    revenue: number;
  }>;
  date_range: {
    start_date: string;
    end_date: string;
  };
}
const CommunityManagerDashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Advanced filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    from: string;
    to: string;
  }>({
    from: '',
    to: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [eventForm, setEventForm] = useState<EventFormData>({
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    capacity: 50,
    price: 0,
    category: 'workshop'
  });
  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
    fetchAnalytics();
  }, []);
  const fetchEvents = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('events').select('*').order('event_date', {
        ascending: true
      });
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchRegistrations = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('event_registrations').select(`
          *,
          events (
            title,
            event_date,
            start_time,
            end_time,
            location,
            category
          )
        `).order('registration_date', {
        ascending: false
      });
      if (error) throw error;
      setRegistrations(data as any || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch registrations",
        variant: "destructive"
      });
    }
  };
  const fetchAnalytics = async () => {
    try {
      const {
        data,
        error
      } = await supabase.rpc('get_event_analytics');
      if (error) throw error;
      setAnalytics(data as unknown as EventAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics",
        variant: "destructive"
      });
    }
  };
  const handleEventSubmit = async () => {
    try {
      if (editingEvent) {
        // Update existing event
        const {
          error
        } = await supabase.from('events').update(eventForm).eq('id', editingEvent.id);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Event updated successfully"
        });
      } else {
        // Create new event
        const {
          error
        } = await supabase.from('events').insert([eventForm]);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Event created successfully"
        });
      }
      setIsEventDialogOpen(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
      fetchAnalytics(); // Refresh analytics when events change
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive"
      });
    }
  };
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      title_ar: (event as any).title_ar || '',
      description: event.description || '',
      description_ar: (event as any).description_ar || '',
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location || '',
      capacity: event.capacity,
      price: event.price,
      category: event.category
    });
    setIsEventDialogOpen(true);
  };
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const {
        error
      } = await supabase.from('events').update({
        is_active: false
      }).eq('id', eventId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
      fetchEvents();
      fetchAnalytics(); // Refresh analytics when events change
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    }
  };
  const resetForm = () => {
    setEventForm({
      title: '',
      title_ar: '',
      description: '',
      description_ar: '',
      event_date: '',
      start_time: '',
      end_time: '',
      location: '',
      capacity: 50,
      price: 0,
      category: 'workshop'
    });
  };
  const handleNewEvent = () => {
    setEditingEvent(null);
    resetForm();
    setIsEventDialogOpen(true);
  };
  const updateAttendanceStatus = async (registrationId: string, status: 'registered' | 'attended' | 'no_show' | 'cancelled') => {
    try {
      const {
        error
      } = await supabase.from('event_registrations').update({
        attendance_status: status
      }).eq('id', registrationId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Attendance status updated"
      });
      fetchRegistrations();
      fetchEvents(); // Refresh to update attendee counts
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance status",
        variant: "destructive"
      });
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered':
        return 'bg-blue-500/10 text-blue-600';
      case 'attended':
        return 'bg-green-500/10 text-green-600';
      case 'no_show':
        return 'bg-red-500/10 text-red-600';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered':
        return <AlertCircle className="h-4 w-4" />;
      case 'attended':
        return <CheckCircle className="h-4 w-4" />;
      case 'no_show':
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'workshop':
        return 'bg-blue-500/10 text-blue-600';
      case 'networking':
        return 'bg-green-500/10 text-green-600';
      case 'social':
        return 'bg-purple-500/10 text-purple-600';
      case 'training':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };
  const filteredRegistrations = selectedEventFilter === 'all' ? registrations : registrations.filter(reg => reg.event_id === selectedEventFilter);

  // Enhanced filtering with all filters combined
  const fullyFilteredRegistrations = filteredRegistrations.filter(reg => {
    // Status filter
    if (statusFilter !== 'all' && reg.attendance_status !== statusFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = reg.attendee_name.toLowerCase().includes(query) || reg.attendee_email.toLowerCase().includes(query) || reg.attendee_phone.includes(query) || reg.events?.title.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Date range filter
    if (dateRangeFilter.from && reg.events?.event_date) {
      if (new Date(reg.events.event_date) < new Date(dateRangeFilter.from)) return false;
    }
    if (dateRangeFilter.to && reg.events?.event_date) {
      if (new Date(reg.events.event_date) > new Date(dateRangeFilter.to)) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && reg.events?.category !== categoryFilter) return false;
    return true;
  });

  // Export functions
  const exportToCSV = () => {
    const headers = ['Attendee Name', 'Email', 'Phone', 'Event', 'Event Date', 'Registration Date', 'Status', 'Special Requests'];
    const rows = fullyFilteredRegistrations.map(reg => [reg.attendee_name, reg.attendee_email, reg.attendee_phone, reg.events?.title || '', reg.events?.event_date || '', new Date(reg.registration_date).toLocaleDateString(), reg.attendance_status, reg.special_requests || 'None']);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendees-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({
      title: "Export Successful",
      description: `Exported ${fullyFilteredRegistrations.length} attendees to CSV`
    });
  };
  const exportAnalyticsReport = () => {
    if (!analytics) return;
    const report = `
EVENT ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}
Period: ${analytics.date_range.start_date} to ${analytics.date_range.end_date}

OVERVIEW
========
Total Events: ${analytics.total_events}
Total Registrations: ${analytics.total_registrations}
Total Revenue: ${analytics.total_revenue.toFixed(2)} EGP
Average Attendance Rate: ${analytics.avg_attendance_rate}%

POPULAR CATEGORIES
==================
${analytics.popular_categories.map(cat => `${cat.category}: ${cat.count} events, ${cat.registrations} registrations`).join('\n')}

MONTHLY PERFORMANCE
===================
${analytics.monthly_stats.map(month => `${month.month}: ${month.events} events, ${month.registrations} registrations, ${month.revenue} EGP`).join('\n')}

ATTENDEE BREAKDOWN
==================
${fullyFilteredRegistrations.length} Total Registrations
Attended: ${fullyFilteredRegistrations.filter(r => r.attendance_status === 'attended').length}
Registered: ${fullyFilteredRegistrations.filter(r => r.attendance_status === 'registered').length}
No Show: ${fullyFilteredRegistrations.filter(r => r.attendance_status === 'no_show').length}
Cancelled: ${fullyFilteredRegistrations.filter(r => r.attendance_status === 'cancelled').length}
    `.trim();
    const blob = new Blob([report], {
      type: 'text/plain'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({
      title: "Report Exported",
      description: "Analytics report has been downloaded"
    });
  };
  const clearFilters = () => {
    setStatusFilter('all');
    setDateRangeFilter({
      from: '',
      to: ''
    });
    setSearchQuery('');
    setCategoryFilter('all');
    setSelectedEventFilter('all');
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            
            <div>
              <h1 className="text-3xl font-bold text-foreground">Community Manager Dashboard</h1>
              <p className="text-muted-foreground">Manage events and community activities</p>
            </div>
          </div>
          <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewEvent} className="gap-2">
                <Plus className="h-4 w-4" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                <DialogDescription>
                  {editingEvent ? 'Update event details' : 'Fill in the event information'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Event Title (English)</Label>
                    <Input id="title" value={eventForm.title} onChange={e => setEventForm(prev => ({
                    ...prev,
                    title: e.target.value
                  }))} placeholder="Enter event title" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title_ar">Event Title (Arabic)</Label>
                    <Input id="title_ar" value={eventForm.title_ar} onChange={e => setEventForm(prev => ({
                    ...prev,
                    title_ar: e.target.value
                  }))} placeholder="أدخل عنوان الفعالية" dir="rtl" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (English)</Label>
                  <Textarea id="description" value={eventForm.description} onChange={e => setEventForm(prev => ({
                  ...prev,
                  description: e.target.value
                }))} placeholder="Enter event description" rows={3} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description_ar">Description (Arabic)</Label>
                  <Textarea id="description_ar" value={eventForm.description_ar} onChange={e => setEventForm(prev => ({
                  ...prev,
                  description_ar: e.target.value
                }))} placeholder="أدخل وصف الفعالية" rows={3} dir="rtl" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="event_date">Date</Label>
                    <Input id="event_date" type="date" value={eventForm.event_date} onChange={e => setEventForm(prev => ({
                    ...prev,
                    event_date: e.target.value
                  }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={eventForm.category} onValueChange={value => setEventForm(prev => ({
                    ...prev,
                    category: value
                  }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="networking">Networking</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input id="start_time" type="time" value={eventForm.start_time} onChange={e => setEventForm(prev => ({
                    ...prev,
                    start_time: e.target.value
                  }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input id="end_time" type="time" value={eventForm.end_time} onChange={e => setEventForm(prev => ({
                    ...prev,
                    end_time: e.target.value
                  }))} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={eventForm.location} onChange={e => setEventForm(prev => ({
                  ...prev,
                  location: e.target.value
                }))} placeholder="Event location" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input id="capacity" type="number" value={eventForm.capacity} onChange={e => setEventForm(prev => ({
                    ...prev,
                    capacity: parseInt(e.target.value) || 0
                  }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (EGP)</Label>
                    <Input id="price" type="number" step="0.01" value={eventForm.price} onChange={e => setEventForm(prev => ({
                    ...prev,
                    price: parseFloat(e.target.value) || 0
                  }))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEventSubmit}>
                  {editingEvent ? 'Update' : 'Create'} Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">
                {events.filter(e => e.is_active).length} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter(e => {
                const eventDate = new Date(e.event_date);
                const now = new Date();
                return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
              }).length}
              </div>
              <p className="text-xs text-muted-foreground">events scheduled</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.reduce((sum, event) => sum + event.registered_attendees, 0)}
              </div>
              <p className="text-xs text-muted-foreground">registered</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.reduce((sum, event) => sum + event.registered_attendees * event.price, 0).toFixed(0)} EGP
              </div>
              <p className="text-xs text-muted-foreground">from events</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Events Management</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Events Management</CardTitle>
                <CardDescription>Create, edit, and manage community events</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map(event => <TableRow key={event.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground">{event.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{new Date(event.event_date).toLocaleDateString()}</div>
                            <div className="text-sm text-muted-foreground">
                              {event.start_time} - {event.end_time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location || 'TBD'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{event.registered_attendees}</span>
                            <span className="text-muted-foreground">/{event.capacity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(event.category)}>
                            {event.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {event.price > 0 ? `${event.price} EGP` : 'Free'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.is_active ? "default" : "secondary"}>
                            {event.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditEvent(event)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendees" className="space-y-4">
            {/* Advanced Filters Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Advanced Filters
                    </CardTitle>
                    <CardDescription>Filter attendees by multiple criteria</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Name, email, or phone..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8" />
                    </div>
                  </div>

                  {/* Event Filter */}
                  <div className="space-y-2">
                    <Label>Event</Label>
                    <Select value={selectedEventFilter} onValueChange={setSelectedEventFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Events" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {events.map(event => <SelectItem key={event.id} value={event.id}>
                            {event.title}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="registered">Registered</SelectItem>
                        <SelectItem value="attended">Attended</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="networking">Networking</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input type="date" value={dateRangeFilter.from} onChange={e => setDateRangeFilter(prev => ({
                    ...prev,
                    from: e.target.value
                  }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input type="date" value={dateRangeFilter.to} onChange={e => setDateRangeFilter(prev => ({
                    ...prev,
                    to: e.target.value
                  }))} />
                  </div>
                </div>

                {/* Filter Summary */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      Showing {fullyFilteredRegistrations.length} of {registrations.length} attendees
                    </span>
                    {(statusFilter !== 'all' || searchQuery || dateRangeFilter.from || dateRangeFilter.to || categoryFilter !== 'all' || selectedEventFilter !== 'all') && <span className="text-muted-foreground">{registrations.length - fullyFilteredRegistrations.length} filtered out</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendees Table */}
            <Card>
              <CardHeader>
                <CardTitle>Attendee Management</CardTitle>
                <CardDescription>Track and manage event registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Attendee</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Special Requests</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fullyFilteredRegistrations.map(registration => <TableRow key={registration.id}>
                        <TableCell className="font-medium">{registration.attendee_name}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{registration.events?.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {registration.events?.event_date ? new Date(registration.events.event_date).toLocaleDateString() : ''}
                              {registration.events?.start_time && ` at ${registration.events.start_time}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {registration.attendee_email}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {registration.attendee_phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(registration.registration_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(registration.attendance_status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(registration.attendance_status)}
                              {registration.attendance_status}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-32 truncate text-sm text-muted-foreground">
                            {registration.special_requests || 'None'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Select value={registration.attendance_status} onValueChange={(value: 'registered' | 'attended' | 'no_show' | 'cancelled') => updateAttendanceStatus(registration.id, value)}>
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="registered">Registered</SelectItem>
                                <SelectItem value="attended">Attended</SelectItem>
                                <SelectItem value="no_show">No Show</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
                
                {fullyFilteredRegistrations.length === 0 && <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="font-medium">No attendees found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Event Analytics
                    </CardTitle>
                    <CardDescription>Event performance and attendance metrics</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportAnalyticsReport} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Export Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {analytics ? <div className="space-y-6">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm font-medium">Total Events</div>
                          </div>
                          <div className="text-2xl font-bold mt-2">{analytics.total_events}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm font-medium">Total Registrations</div>
                          </div>
                          <div className="text-2xl font-bold mt-2">{analytics.total_registrations}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm font-medium">Total Revenue</div>
                          </div>
                          <div className="text-2xl font-bold mt-2">{analytics.total_revenue.toFixed(0)} EGP</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm font-medium">Avg Attendance Rate</div>
                          </div>
                          <div className="text-2xl font-bold mt-2">{analytics.avg_attendance_rate}%</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Attendee Status Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Attendee Status Breakdown</CardTitle>
                        <CardDescription>Current status of all registrations</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2 p-4 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">Attended</span>
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                              {registrations.filter(r => r.attendance_status === 'attended').length}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(registrations.filter(r => r.attendance_status === 'attended').length / Math.max(registrations.length, 1) * 100).toFixed(1)}% of total
                            </div>
                          </div>

                          <div className="space-y-2 p-4 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">Registered</span>
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                              {registrations.filter(r => r.attendance_status === 'registered').length}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(registrations.filter(r => r.attendance_status === 'registered').length / Math.max(registrations.length, 1) * 100).toFixed(1)}% of total
                            </div>
                          </div>

                          <div className="space-y-2 p-4 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium">No Show</span>
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-red-600">
                              {registrations.filter(r => r.attendance_status === 'no_show').length}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(registrations.filter(r => r.attendance_status === 'no_show').length / Math.max(registrations.length, 1) * 100).toFixed(1)}% of total
                            </div>
                          </div>

                          <div className="space-y-2 p-4 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium">Cancelled</span>
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-600">
                              {registrations.filter(r => r.attendance_status === 'cancelled').length}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(registrations.filter(r => r.attendance_status === 'cancelled').length / Math.max(registrations.length, 1) * 100).toFixed(1)}% of total
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Popular Categories */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Popular Event Categories</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analytics.popular_categories.map((category, index) => <div key={category.category} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium capitalize">{category.category}</span>
                                <span className="text-muted-foreground">
                                  {category.count} events • {category.registrations} registrations
                                </span>
                              </div>
                              <Progress value={category.registrations / Math.max(...analytics.popular_categories.map(c => c.registrations)) * 100} className="h-2" />
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Monthly Trends */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Performance Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analytics.monthly_stats.slice(-6).map(month => <div key={month.month} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-4">
                                <div className="text-sm font-medium min-w-20">{month.month}</div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {month.events} events
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {month.registrations} registrations
                                </div>
                              </div>
                              <div className="text-sm font-medium">
                                {month.revenue.toFixed(0)} EGP
                              </div>
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Registration Status Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Registration Status Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {['registered', 'attended', 'no_show', 'cancelled'].map(status => {
                        const count = registrations.filter(r => r.attendance_status === status).length;
                        const percentage = registrations.length > 0 ? (count / registrations.length * 100).toFixed(1) : '0';
                        return <div key={status} className="text-center p-4 rounded-lg bg-muted/50">
                                <div className="text-2xl font-bold">{count}</div>
                                <div className="text-sm text-muted-foreground capitalize">{status.replace('_', ' ')}</div>
                                <div className="text-xs text-muted-foreground">{percentage}%</div>
                              </div>;
                      })}
                        </div>
                      </CardContent>
                    </Card>
                  </div> : <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading analytics...</p>
                  </div>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default CommunityManagerDashboard;