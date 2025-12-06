import { Bell, BellOff, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const NotificationPermissionCard = () => {
  const { t } = useTranslation();
  const { permission, isSupported, requestPermission } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  if (permission === 'granted') {
    return (
      <Card className="bg-green-500/10 border-green-500/30">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-500/20">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              {t('notificationsEnabled', 'Notifications Enabled')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('receiveAchievementAlerts', "You'll receive alerts for achievements")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card className="bg-destructive/10 border-destructive/30">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-full bg-destructive/20">
            <BellOff className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">
              {t('notificationsBlocked', 'Notifications Blocked')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('enableInSettings', 'Enable in browser settings to receive alerts')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/20">
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {t('enableNotifications', 'Enable Notifications')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('getAlertedAchievements', 'Get alerted when you unlock achievements')}
          </p>
        </div>
        <Button size="sm" onClick={requestPermission}>
          {t('enable', 'Enable')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationPermissionCard;
