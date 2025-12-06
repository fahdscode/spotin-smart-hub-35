import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import NotificationPermissionCard from './NotificationPermissionCard';
import { 
  Award, ShoppingBag, Coffee, Heart, Star, Coins, 
  PiggyBank, Trophy, MapPin, Home, Building, Wallet, 
  Gem, Calendar, Users, Lock, CheckCircle2, Sparkles
} from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  icon: string;
  badge_color: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points_reward: number;
  is_unlocked: boolean;
  unlocked_at?: string;
  current_progress: number;
}

interface AchievementBadgesProps {
  clientId: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'award': Award,
  'shopping-bag': ShoppingBag,
  'coffee': Coffee,
  'heart': Heart,
  'star': Star,
  'coins': Coins,
  'piggy-bank': PiggyBank,
  'trophy': Trophy,
  'map-pin': MapPin,
  'home': Home,
  'building': Building,
  'wallet': Wallet,
  'gem': Gem,
  'calendar': Calendar,
  'users': Users,
};

const AchievementBadges = ({ clientId }: AchievementBadgesProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { showAchievementUnlocked, showAchievementProgress, permission } = usePushNotifications();
  const isArabic = i18n.language === 'ar';
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousAchievements, setPreviousAchievements] = useState<Achievement[]>([]);

  const getLocalizedText = (item: Achievement, field: 'name' | 'description') => {
    if (isArabic && item[`${field}_ar` as keyof Achievement]) {
      return item[`${field}_ar` as keyof Achievement] as string;
    }
    return item[field];
  };

  useEffect(() => {
    fetchAchievements();
    checkForNewAchievements();
  }, [clientId]);

  const fetchAchievements = async (): Promise<Achievement[] | null> => {
    try {
      const { data, error } = await supabase.rpc('get_client_achievements', {
        p_client_id: clientId
      });

      if (error) throw error;
      const achievementData = (data as unknown as Achievement[]) || [];
      setPreviousAchievements(achievements);
      setAchievements(achievementData);
      return achievementData;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkForNewAchievements = async () => {
    try {
      const { data, error } = await supabase.rpc('check_and_award_achievements', {
        p_client_id: clientId
      });

      if (error) throw error;

      const result = data as unknown as { 
        newly_unlocked: string[]; 
        points_awarded: number;
      };

      if (result.newly_unlocked && result.newly_unlocked.length > 0) {
        // Show in-app toast
        toast({
          title: '🎉 ' + t('achievementUnlocked', 'Achievement Unlocked!'),
          description: result.points_awarded > 0 
            ? t('earnedBonusPoints', `You earned ${result.points_awarded} bonus points!`)
            : t('checkYourBadges', 'Check your new badges!'),
        });
        
        // Fetch updated achievements to get names for push notification
        const updatedAchievements = await fetchAchievements();
        
        // Send push notification for each newly unlocked achievement
        if (permission === 'granted' && updatedAchievements) {
          for (const achievementId of result.newly_unlocked) {
            const achievement = updatedAchievements.find(a => a.id === achievementId);
            if (achievement) {
              showAchievementUnlocked(
                getLocalizedText(achievement, 'name'),
                achievement.points_reward > 0 ? achievement.points_reward : undefined
              );
            }
          }
        }
      } else {
        // Check for achievements close to unlocking (80%+ progress)
        if (permission === 'granted' && achievements.length > 0) {
          const closeToUnlocking = achievements.filter(a => {
            if (a.is_unlocked) return false;
            const progress = (a.current_progress / a.requirement_value) * 100;
            return progress >= 80 && progress < 100;
          });
          
          // Notify about one achievement that's close
          if (closeToUnlocking.length > 0 && Math.random() < 0.3) { // 30% chance to avoid spam
            const achievement = closeToUnlocking[0];
            showAchievementProgress(
              getLocalizedText(achievement, 'name'),
              achievement.current_progress,
              achievement.requirement_value
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Award;
  };

  const getProgressPercent = (current: number, required: number) => {
    return Math.min((current / required) * 100, 100);
  };

  const unlockedCount = achievements.filter(a => a.is_unlocked).length;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const categorizedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryLabels: Record<string, string> = {
    orders: t('orderMilestones', 'Order Milestones'),
    points: t('pointsMilestones', 'Points Milestones'),
    visits: t('visitMilestones', 'Visit Milestones'),
    spending: t('spendingMilestones', 'Spending Milestones'),
    events: t('eventMilestones', 'Event Milestones'),
  };

  return (
    <div className="space-y-4">
      {/* Notification Permission Card */}
      <NotificationPermissionCard />
      
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/20">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('achievementsUnlocked', 'Achievements Unlocked')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {unlockedCount} / {totalCount}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Progress 
                value={totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0} 
                className="w-24 h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}% {t('complete', 'Complete')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Badges Showcase */}
      {unlockedCount > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              {t('yourBadges', 'Your Badges')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2">
              {achievements
                .filter(a => a.is_unlocked)
                .map(achievement => {
                  const Icon = getIcon(achievement.icon);
                  return (
                    <div
                      key={achievement.id}
                      className={`p-2 rounded-full ${achievement.badge_color} text-white shadow-md`}
                      title={getLocalizedText(achievement, 'name')}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Categories */}
      {Object.entries(categorizedAchievements).map(([category, categoryAchievements]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">
            {categoryLabels[category] || category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryAchievements.map(achievement => {
              const Icon = getIcon(achievement.icon);
              const progress = getProgressPercent(achievement.current_progress, achievement.requirement_value);
              const isUnlocked = achievement.is_unlocked;

              return (
                <Card 
                  key={achievement.id}
                  className={`transition-all ${
                    isUnlocked 
                      ? 'border-2 border-green-500/50 bg-green-500/5' 
                      : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full shrink-0 ${
                        isUnlocked 
                          ? `${achievement.badge_color} text-white shadow-lg` 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isUnlocked ? (
                          <Icon className="h-5 w-5" />
                        ) : (
                          <Lock className="h-5 w-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium text-sm truncate ${
                            isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {getLocalizedText(achievement, 'name')}
                          </p>
                          {isUnlocked && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {getLocalizedText(achievement, 'description')}
                        </p>

                        {isUnlocked ? (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ {t('unlocked', 'Unlocked')} {achievement.unlocked_at && 
                              new Date(achievement.unlocked_at).toLocaleDateString()
                            }
                          </p>
                        ) : (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">
                                {achievement.current_progress} / {achievement.requirement_value}
                              </span>
                              <span className="text-muted-foreground">
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        )}

                        {achievement.points_reward > 0 && (
                          <Badge 
                            variant={isUnlocked ? "default" : "outline"} 
                            className="mt-2 text-xs"
                          >
                            <Coins className="h-3 w-3 mr-1" />
                            +{achievement.points_reward} {t('points', 'pts')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AchievementBadges;
