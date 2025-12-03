import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, Crown, Star, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface LeaderboardEntry {
  rank: number;
  client_id: string;
  client_name: string;
  points_earned: number;
  transactions_count: number;
}

interface ClientRank {
  rank: number | null;
  points_this_month: number;
  total_participants: number;
}

interface PointsLeaderboardProps {
  clientId: string;
}

const PointsLeaderboard = ({ clientId }: PointsLeaderboardProps) => {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [clientRank, setClientRank] = useState<ClientRank | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, [clientId]);

  const fetchLeaderboardData = async () => {
    try {
      // Fetch leaderboard and client rank in parallel
      const [leaderboardResult, rankResult] = await Promise.all([
        supabase.rpc('get_monthly_leaderboard', { p_limit: 10 }),
        supabase.rpc('get_client_monthly_rank', { p_client_id: clientId })
      ]);

      if (leaderboardResult.data) {
        setLeaderboard(leaderboardResult.data as unknown as LeaderboardEntry[]);
      }

      if (rankResult.data) {
        setClientRank(rankResult.data as unknown as ClientRank);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0">
            <Trophy className="h-3 w-3 mr-1" />
            Champion
          </Badge>
        );
      case 2:
        return (
          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
            <Star className="h-3 w-3 mr-1" />
            Elite
          </Badge>
        );
      case 3:
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            <Award className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        );
      default:
        return null;
    }
  };

  const getRankBackground = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-primary/10 border-primary';
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300';
      default:
        return 'bg-card border-border';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const currentMonth = format(new Date(), 'MMMM yyyy');

  return (
    <div className="space-y-4">
      {/* Your Rank Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('yourRank', 'Your Rank')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {clientRank?.rank ? `#${clientRank.rank}` : t('unranked', 'Unranked')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('pointsThisMonth', 'Points This Month')}</p>
              <p className="text-xl font-bold text-primary">{clientRank?.points_this_month || 0}</p>
              {clientRank?.total_participants && (
                <p className="text-xs text-muted-foreground">
                  {t('outOf', 'of')} {clientRank.total_participants} {t('members', 'members')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t('topEarners', 'Top Point Earners')} - {currentMonth}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>{t('noLeaderboardData', 'No points earned this month yet')}</p>
              <p className="text-sm">{t('beTheFirst', 'Be the first to earn points!')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.client_id === clientId;
                return (
                  <div
                    key={entry.client_id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${getRankBackground(entry.rank, isCurrentUser)}`}
                  >
                    {/* Rank */}
                    <div className="w-8 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Name & Badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                          {entry.client_name}
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground ml-1">({t('you', 'You')})</span>
                          )}
                        </span>
                        {getRankBadge(entry.rank)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.transactions_count} {t('purchases', 'purchases')}
                      </p>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <span className="font-bold text-lg text-primary">{entry.points_earned}</span>
                      <p className="text-xs text-muted-foreground">{t('points', 'pts')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 3 Rewards Info */}
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
            <Award className="h-4 w-4 text-yellow-600" />
            {t('monthlyRewards', 'Monthly Top Rewards')}
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="p-2 rounded-lg bg-background/50">
              <Crown className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
              <p className="font-medium text-foreground">#1</p>
              <p className="text-xs text-muted-foreground">{t('freeItem', 'Free Item')}</p>
            </div>
            <div className="p-2 rounded-lg bg-background/50">
              <Medal className="h-5 w-5 mx-auto text-gray-400 mb-1" />
              <p className="font-medium text-foreground">#2</p>
              <p className="text-xs text-muted-foreground">{t('bonus50pts', '50 Bonus Pts')}</p>
            </div>
            <div className="p-2 rounded-lg bg-background/50">
              <Medal className="h-5 w-5 mx-auto text-amber-600 mb-1" />
              <p className="font-medium text-foreground">#3</p>
              <p className="text-xs text-muted-foreground">{t('bonus25pts', '25 Bonus Pts')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PointsLeaderboard;
