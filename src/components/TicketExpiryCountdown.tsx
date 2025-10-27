import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, differenceInMinutes, differenceInHours } from 'date-fns';

interface TicketExpiryCountdownProps {
  purchaseTime: Date;
  expiryHours?: number;
  onExpired?: () => void;
}

export const TicketExpiryCountdown = ({ 
  purchaseTime, 
  expiryHours = 24,
  onExpired 
}: TicketExpiryCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [progressPercent, setProgressPercent] = useState(100);
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const expiryTime = new Date(purchaseTime.getTime() + expiryHours * 60 * 60 * 1000);
      const minutesLeft = differenceInMinutes(expiryTime, now);
      const hoursLeft = differenceInHours(expiryTime, now);
      
      if (minutesLeft <= 0) {
        setIsExpired(true);
        setProgressPercent(0);
        setTimeLeft('Expired');
        onExpired?.();
        return;
      }

      // Calculate progress percentage
      const totalMinutes = expiryHours * 60;
      const percent = (minutesLeft / totalMinutes) * 100;
      setProgressPercent(percent);

      // Set urgency level
      if (hoursLeft <= 1) {
        setUrgencyLevel('critical');
      } else if (hoursLeft <= 3) {
        setUrgencyLevel('warning');
      } else {
        setUrgencyLevel('normal');
      }

      // Format time display
      if (hoursLeft > 0) {
        const remainingMinutes = minutesLeft % 60;
        setTimeLeft(`${hoursLeft}h ${remainingMinutes}m remaining`);
      } else {
        setTimeLeft(`${minutesLeft} minutes remaining`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [purchaseTime, expiryHours, onExpired]);

  const getStatusColor = () => {
    if (isExpired) return 'bg-destructive';
    if (urgencyLevel === 'critical') return 'bg-red-500';
    if (urgencyLevel === 'warning') return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (isExpired) return <AlertTriangle className="h-4 w-4" />;
    if (urgencyLevel === 'critical') return <Clock className="h-4 w-4 animate-pulse" />;
    if (urgencyLevel === 'warning') return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card className={`${isExpired ? 'border-destructive' : urgencyLevel === 'critical' ? 'border-red-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getStatusIcon()}
            Day Pass Status
          </CardTitle>
          <Badge 
            variant={isExpired ? 'destructive' : 'default'}
            className={!isExpired ? getStatusColor() : ''}
          >
            {isExpired ? 'Expired' : urgencyLevel === 'critical' ? 'Expiring Soon' : 'Active'}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {isExpired 
            ? 'Your day pass has expired' 
            : `Purchased ${formatDistanceToNow(purchaseTime, { addSuffix: true })}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time Remaining</span>
            <span className={`font-semibold ${
              isExpired ? 'text-destructive' : 
              urgencyLevel === 'critical' ? 'text-red-500' :
              urgencyLevel === 'warning' ? 'text-orange-500' :
              'text-green-600'
            }`}>
              {timeLeft}
            </span>
          </div>
          <Progress 
            value={progressPercent} 
            className="h-2"
          />
        </div>

        {urgencyLevel === 'critical' && !isExpired && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="text-xs text-red-600 dark:text-red-400">
              <p className="font-semibold">Your pass expires soon!</p>
              <p className="text-red-500 dark:text-red-500">Consider extending or purchasing a new pass.</p>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-xs text-destructive">
              <p className="font-semibold">Pass Expired</p>
              <p>Please purchase a new day pass to continue access.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
