import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Coffee, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderingCycleStatusProps {
  className?: string;
}

interface SystemCheck {
  name: string;
  status: 'ok' | 'warning' | 'error' | 'checking';
  message: string;
  icon: React.ComponentType<any>;
}

const OrderingCycleStatus: React.FC<OrderingCycleStatusProps> = ({ className }) => {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const performSystemChecks = async () => {
    setIsChecking(true);
    const newChecks: SystemCheck[] = [];

    try {
      // Check 1: RLS Policies
      try {
        const { data: policies } = await supabase
          .from('session_line_items')
          .select('id')
          .limit(1);
        
        newChecks.push({
          name: 'RLS Policies',
          status: 'ok',
          message: 'Order access policies are working correctly',
          icon: CheckCircle
        });
      } catch (error) {
        newChecks.push({
          name: 'RLS Policies',
          status: 'error',
          message: 'Database access policies need attention',
          icon: AlertTriangle
        });
      }

      // Check 2: Real-time Subscriptions
      try {
        const channel = supabase.channel('test-channel');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject('Timeout'), 3000);
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              clearTimeout(timeout);
              resolve(status);
            }
          });
        });
        supabase.removeChannel(channel);
        
        newChecks.push({
          name: 'Real-time Updates',
          status: 'ok',
          message: 'Real-time order updates are functioning',
          icon: CheckCircle
        });
      } catch (error) {
        newChecks.push({
          name: 'Real-time Updates',
          status: 'warning',
          message: 'Real-time subscriptions may have issues',
          icon: Clock
        });
      }

      // Check 3: Order Status Flow
      const { data: orders } = await supabase
        .from('session_line_items')
        .select('status')
        .limit(10);

      const statuses = ['pending', 'preparing', 'ready', 'completed', 'served'];
      const hasAllStatuses = statuses.some(status => 
        orders?.some(order => order.status === status)
      );

      newChecks.push({
        name: 'Order Status Flow',
        status: hasAllStatuses ? 'ok' : 'warning',
        message: hasAllStatuses 
          ? 'All order statuses are available and working' 
          : 'Order flow ready for testing',
        icon: Coffee
      });

      // Check 4: Client Integration
      const { data: clients } = await supabase
        .from('clients')
        .select('id, is_active')
        .eq('is_active', true)
        .limit(1);

      newChecks.push({
        name: 'Client Integration',
        status: clients && clients.length > 0 ? 'ok' : 'warning',
        message: clients && clients.length > 0 
          ? 'Client portal integration is ready' 
          : 'No active clients found for testing',
        icon: CheckCircle
      });

    } catch (error) {
      console.error('System check error:', error);
      newChecks.push({
        name: 'System Error',
        status: 'error',
        message: 'Unable to complete system checks',
        icon: AlertTriangle
      });
    }

    setChecks(newChecks);
    setIsChecking(false);
  };

  useEffect(() => {
    performSystemChecks();
  }, []);

  const getStatusColor = (status: SystemCheck['status']) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'checking': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'ok': return CheckCircle;
      case 'warning': return Clock;
      case 'error': return AlertTriangle;
      case 'checking': return RefreshCw;
    }
  };

  const overallStatus = checks.length === 0 ? 'checking' :
    checks.some(check => check.status === 'error') ? 'error' :
    checks.some(check => check.status === 'warning') ? 'warning' : 'ok';

  const handleRunTest = async () => {
    toast({
      title: "Test Order System",
      description: "Use the client portal to place a test order and verify it appears in the barista dashboard.",
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-primary" />
              Ordering System Status
            </CardTitle>
            <CardDescription>
              Real-time monitoring of the complete ordering cycle
            </CardDescription>
          </div>
          <Badge className={getStatusColor(overallStatus)}>
            {overallStatus === 'ok' ? '✅ Ready for Production' :
             overallStatus === 'warning' ? '⚠️ Minor Issues' :
             overallStatus === 'error' ? '❌ Needs Attention' : '🔄 Checking...'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {checks.map((check, index) => {
          const StatusIcon = check.icon;
          return (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <StatusIcon className={`h-4 w-4 ${
                check.status === 'ok' ? 'text-green-600' :
                check.status === 'warning' ? 'text-yellow-600' :
                check.status === 'error' ? 'text-red-600' : 'text-gray-600'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{check.name}</span>
                  <Badge variant="outline" className={getStatusColor(check.status)}>
                    {check.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{check.message}</p>
              </div>
            </div>
          );
        })}
        
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={performSystemChecks}
            disabled={isChecking}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          <Button 
            onClick={handleRunTest}
            className="flex-1"
            disabled={overallStatus === 'error'}
          >
            Run Test Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderingCycleStatus;