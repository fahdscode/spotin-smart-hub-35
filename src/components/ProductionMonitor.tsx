import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, Users, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SystemMetrics {
  activeClients: number;
  todayRegistrations: number;
  systemErrors: number;
  lastError?: {
    message: string;
    timestamp: string;
  };
}

const ProductionMonitor = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeClients: 0,
    todayRegistrations: 0,
    systemErrors: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      // Get active clients count
      const { data: activeClients } = await supabase
        .from('clients')
        .select('id', { count: 'exact' })
        .eq('active', true)
        .eq('is_active', true);

      // Get today's registrations
      const today = new Date().toISOString().split('T')[0];
      const { data: todayRegs } = await supabase
        .from('clients')
        .select('id', { count: 'exact' })
        .gte('created_at', today);

      // Get recent system errors
      const { data: errors } = await supabase
        .from('system_logs')
        .select('*')
        .eq('log_level', 'ERROR')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      setMetrics({
        activeClients: activeClients?.length || 0,
        todayRegistrations: todayRegs?.length || 0,
        systemErrors: errors?.length || 0,
        lastError: errors?.[0] ? {
          message: errors[0].message,
          timestamp: new Date(errors[0].created_at).toLocaleString()
        } : undefined
      });

    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      toast.error("Failed to load system metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Production Monitor</h2>
          <p className="text-muted-foreground">Real-time system health and metrics</p>
        </div>
        <Button onClick={fetchMetrics} variant="outline" size="sm">
          <Activity className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              Currently checked in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Registrations</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.todayRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              New clients today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {metrics.systemErrors > 0 ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={metrics.systemErrors > 0 ? "destructive" : "default"}>
                {metrics.systemErrors > 0 ? `${metrics.systemErrors} Errors` : "Healthy"}
              </Badge>
            </div>
            {metrics.lastError && (
              <div className="mt-2 p-2 bg-destructive/10 rounded text-xs">
                <p className="font-medium">Last Error:</p>
                <p className="text-destructive">{metrics.lastError.message}</p>
                <p className="text-muted-foreground mt-1">
                  {metrics.lastError.timestamp}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {isLoading && (
        <div className="text-center py-8">
          <Clock className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading metrics...</p>
        </div>
      )}
    </div>
  );
};

export default ProductionMonitor;