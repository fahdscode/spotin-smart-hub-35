import { useState, useEffect } from "react";
import { ArrowLeft, QrCode, Users, UserPlus, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import SpotinHeader from "@/components/SpotinHeader";
import MetricCard from "@/components/MetricCard";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckIn {
  id: string;
  user_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  status: string;
}

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [profiles, setProfiles] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheckIns();
  }, []);

  const fetchCheckIns = async () => {
    try {
      const { data: checkInsData, error } = await supabase
        .from('check_ins')
        .select('*')
        .order('checked_in_at', { ascending: false });

      if (error) throw error;
      setCheckIns(checkInsData || []);

      // Fetch profiles for the users
      if (checkInsData && checkInsData.length > 0) {
        const userIds = [...new Set(checkInsData.map(checkIn => checkIn.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, barcode')
          .in('user_id', userIds);

        if (profilesData) {
          const profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as {[key: string]: any});
          setProfiles(profilesMap);
        }
      }
    } catch (error: any) {
      console.error('Error fetching check-ins:', error);
      toast.error('Failed to fetch check-ins');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (checkInId: string) => {
    try {
      const { error } = await supabase
        .from('check_ins')
        .update({ 
          status: 'checked_out', 
          checked_out_at: new Date().toISOString() 
        })
        .eq('id', checkInId);

      if (error) throw error;

      toast.success('User checked out successfully');
      fetchCheckIns();
    } catch (error: any) {
      console.error('Error during checkout:', error);
      toast.error('Failed to check out user');
    }
  };

  const handleManualCheckIn = async (barcode: string) => {
    try {
      // Find user by barcode
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('barcode', barcode)
        .single();

      if (profileError || !profile) {
        toast.error('User not found with this barcode');
        return;
      }

      // Check if user is already checked in
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('status', 'checked_in')
        .single();

      if (existingCheckIn) {
        toast.error('User is already checked in');
        return;
      }

      // Create new check-in
      const { error } = await supabase
        .from('check_ins')
        .insert({
          user_id: profile.user_id,
          status: 'checked_in'
        });

      if (error) throw error;

      toast.success(`${profile.full_name} checked in successfully`);
      setBarcodeInput('');
      fetchCheckIns();
    } catch (error: any) {
      console.error('Error during manual check-in:', error);
      toast.error('Failed to check in user');
    }
  };

  const filteredCheckIns = checkIns.filter(checkIn => {
    const profile = profiles[checkIn.user_id];
    if (!searchQuery) return true;
    return profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           profile?.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeCheckIns = filteredCheckIns.filter(checkIn => checkIn.status === 'checked_in');
  const todayCheckOuts = filteredCheckIns.filter(checkIn => 
    checkIn.status === 'checked_out' && 
    new Date(checkIn.checked_out_at || '').toDateString() === new Date().toDateString()
  );
  const todayTotal = filteredCheckIns.filter(checkIn => 
    new Date(checkIn.checked_in_at).toDateString() === new Date().toDateString()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <SpotinHeader />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Reception Dashboard</h1>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Active Check-ins"
            value={activeCheckIns.length}
            icon={Users}
          />
          <MetricCard
            title="Today's Check-outs"
            value={todayCheckOuts.length}
            icon={CheckCircle}
          />
          <MetricCard
            title="Total Today"
            value={todayTotal.length}
            icon={QrCode}
          />
        </div>

        {/* Manual Check-in */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Manual Check-in
            </CardTitle>
            <CardDescription>
              Scan or enter a user's barcode to check them in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && barcodeInput) {
                    handleManualCheckIn(barcodeInput);
                  }
                }}
              />
              <Button 
                onClick={() => {
                  if (barcodeInput) {
                    handleManualCheckIn(barcodeInput);
                  }
                }}
                disabled={!barcodeInput}
              >
                Check In
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name, email, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Check-ins
            </CardTitle>
            <CardDescription>
              Users currently checked in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : activeCheckIns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active check-ins
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Check-in Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeCheckIns.map((checkIn) => {
                      const profile = profiles[checkIn.user_id];
                      return (
                        <TableRow key={checkIn.id}>
                          <TableCell className="font-medium">
                            {profile?.full_name || 'Unknown'}
                          </TableCell>
                          <TableCell>{profile?.email || 'N/A'}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                              {profile?.barcode || 'N/A'}
                            </code>
                          </TableCell>
                          <TableCell>
                            {new Date(checkIn.checked_in_at).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleCheckOut(checkIn.id)}
                              className="flex items-center gap-1"
                            >
                              <XCircle className="h-4 w-4" />
                              Check Out
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Check-outs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Today's Check-outs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayCheckOuts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No check-outs today
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Check-in Time</TableHead>
                      <TableHead>Check-out Time</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayCheckOuts.map((checkIn) => {
                      const profile = profiles[checkIn.user_id];
                      const duration = checkIn.checked_out_at 
                        ? Math.round((new Date(checkIn.checked_out_at).getTime() - new Date(checkIn.checked_in_at).getTime()) / (1000 * 60))
                        : 0;
                      
                      return (
                        <TableRow key={checkIn.id}>
                          <TableCell className="font-medium">
                            {profile?.full_name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {new Date(checkIn.checked_in_at).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            {checkIn.checked_out_at ? new Date(checkIn.checked_out_at).toLocaleTimeString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {duration} min
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;