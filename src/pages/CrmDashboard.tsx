import { useState } from "react";
import { ArrowLeft, Users, UserPlus, Phone, Mail, Calendar, TrendingUp, Filter, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SpotinHeader from "@/components/SpotinHeader";

const CrmDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const leads = [
    { id: 1, name: "John Smith", email: "john@example.com", phone: "+1234567890", status: "New", source: "Website", value: "2,500 EGP", lastContact: "2024-01-15" },
    { id: 2, name: "Sarah Johnson", email: "sarah@company.com", phone: "+1987654321", status: "Qualified", source: "Referral", value: "5,000 EGP", lastContact: "2024-01-14" },
    { id: 3, name: "Mike Davis", email: "mike@startup.com", phone: "+1555123456", status: "Proposal", source: "LinkedIn", value: "8,500 EGP", lastContact: "2024-01-13" },
    { id: 4, name: "Lisa Chen", email: "lisa@corp.com", phone: "+1444987654", status: "Negotiation", source: "Cold Call", value: "12,000 EGP", lastContact: "2024-01-12" },
  ];

  const customers = [
    { id: 1, name: "Tech Solutions Inc", email: "contact@techsolutions.com", phone: "+1234567890", plan: "Premium", since: "2023-06-15", value: "15,000 EGP", status: "Active" },
    { id: 2, name: "Design Studio", email: "hello@designstudio.com", phone: "+1987654321", plan: "Standard", since: "2023-08-20", value: "8,500 EGP", status: "Active" },
    { id: 3, name: "Marketing Pro", email: "info@marketingpro.com", phone: "+1555123456", plan: "Basic", since: "2023-10-10", value: "3,200 EGP", status: "Renewal Due" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-blue-500/10 text-blue-600";
      case "Qualified": return "bg-green-500/10 text-green-600";
      case "Proposal": return "bg-yellow-500/10 text-yellow-600";
      case "Negotiation": return "bg-orange-500/10 text-orange-600";
      case "Active": return "bg-green-500/10 text-green-600";
      case "Renewal Due": return "bg-red-500/10 text-red-600";
      default: return "bg-gray-500/10 text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SpotinHeader showClock />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate("/")}
              className="hover:shadow-card transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">CRM Dashboard</h1>
              <p className="text-muted-foreground">Manage customer relationships and track leads</p>
            </div>
          </div>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">125,400 EGP</div>
              <p className="text-xs text-muted-foreground">+22% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23.5%</div>
              <p className="text-xs text-muted-foreground">+3.2% from last month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Lead Management</CardTitle>
                    <CardDescription>Track and manage potential customers</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{lead.source}</TableCell>
                        <TableCell className="font-medium">{lead.value}</TableCell>
                        <TableCell>{lead.lastContact}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Contact
                            </Button>
                            <Button variant="outline" size="sm">
                              Update
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
                <CardDescription>Manage existing customers and accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Customer Since</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.plan}</Badge>
                        </TableCell>
                        <TableCell>{customer.since}</TableCell>
                        <TableCell className="font-medium">{customer.value}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(customer.status)}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline</CardTitle>
                <CardDescription>Visual representation of your sales process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-blue-600">New Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">24</div>
                      <div className="text-sm text-muted-foreground">28,000 EGP</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-green-600">Qualified</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">18</div>
                      <div className="text-sm text-muted-foreground">42,500 EGP</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-yellow-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-yellow-600">Proposal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">12</div>
                      <div className="text-sm text-muted-foreground">68,900 EGP</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-orange-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-orange-600">Closing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">8</div>
                      <div className="text-sm text-muted-foreground">$95,200</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>CRM Reports & Analytics</CardTitle>
                <CardDescription>Performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Lead Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Website</span>
                          <span className="font-medium">35%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Referrals</span>
                          <span className="font-medium">28%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>LinkedIn</span>
                          <span className="font-medium">22%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cold Calls</span>
                          <span className="font-medium">15%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Monthly Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>New Leads</span>
                          <span className="font-medium">+12%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Conversions</span>
                          <span className="font-medium">+8%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revenue</span>
                          <span className="font-medium">+22%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Customer Retention</span>
                          <span className="font-medium">94%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CrmDashboard;