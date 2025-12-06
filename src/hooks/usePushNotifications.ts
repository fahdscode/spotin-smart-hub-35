import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      setRegistration(reg);
      console.log('Service Worker registered:', reg);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: '🔔 Notifications Enabled',
          description: 'You will now receive achievement notifications!'
        });
        return true;
      } else if (result === 'denied') {
        toast({
          title: 'Notifications Blocked',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive'
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, toast]);

  const showNotification = useCallback(async (payload: NotificationPayload) => {
    if (permission !== 'granted') {
      console.log('Notifications not permitted');
      return false;
    }

    try {
      // Try to use service worker notification for better support
      if (registration) {
        await registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: payload.tag || 'general',
          data: payload.data || {},
          requireInteraction: true
        } as NotificationOptions);
        return true;
      } else {
        // Fallback to regular notification
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/favicon.ico',
          tag: payload.tag || 'general'
        });
        return true;
      }
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }, [permission, registration]);

  const showAchievementUnlocked = useCallback((achievementName: string, pointsAwarded?: number) => {
    return showNotification({
      title: '🏆 Achievement Unlocked!',
      body: pointsAwarded 
        ? `${achievementName} - You earned ${pointsAwarded} bonus points!`
        : `You unlocked: ${achievementName}`,
      tag: 'achievement-unlocked',
      data: { type: 'achievement', url: '/client' }
    });
  }, [showNotification]);

  const showAchievementProgress = useCallback((achievementName: string, progress: number, required: number) => {
    const percentage = Math.round((progress / required) * 100);
    return showNotification({
      title: '📈 Almost There!',
      body: `${achievementName}: ${progress}/${required} (${percentage}%)`,
      tag: 'achievement-progress',
      data: { type: 'achievement-progress', url: '/client' }
    });
  }, [showNotification]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    showAchievementUnlocked,
    showAchievementProgress
  };
};
