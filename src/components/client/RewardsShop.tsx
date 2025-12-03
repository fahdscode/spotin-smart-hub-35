import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Coins, History, CheckCircle2, Clock, XCircle, Sparkles, ShoppingBag, Percent, TrendingUp, AlertCircle, Trophy, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocalizedFields } from '@/hooks/useLocalizedFields';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from 'react-i18next';
import PointsLeaderboard from './PointsLeaderboard';
import AchievementBadges from './AchievementBadges';

interface Reward {
  id: string;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  points_cost: number;
  reward_type: 'free_item' | 'discount' | 'voucher' | 'upgrade';
  reward_value: any;
  image_url?: string;
  stock_quantity?: number;
}

interface PointsBalance {
  total_points: number;
  lifetime_points: number;
}

interface Transaction {
  id: string;
  transaction_type: string;
  points_amount: number;
  description: string;
  created_at: string;
}

interface Redemption {
  id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  redeemed_at: string;
  rewards_catalog: {
    name: string;
    name_ar?: string;
  };
}

interface RewardsShopProps {
  clientId: string;
}

export default function RewardsShop({ clientId }: RewardsShopProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { getLocalizedField } = useLocalizedFields();
  const [pointsBalance, setPointsBalance] = useState<PointsBalance>({ total_points: 0, lifetime_points: 0 });
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchPointsData();
  }, [clientId]);

  const fetchPointsData = async () => {
    try {
      setLoading(true);

      // Fetch points balance
      const { data: pointsData } = await supabase
        .from('client_points' as any)
        .select('total_points, lifetime_points')
        .eq('client_id', clientId)
        .maybeSingle();

      setPointsBalance((pointsData as any) || { total_points: 0, lifetime_points: 0 });

      // Fetch rewards catalog
      const { data: rewardsData } = await supabase
        .from('rewards_catalog' as any)
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      setRewards((rewardsData as any) || []);

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('points_transactions' as any)
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions((transactionsData as any) || []);

      // Fetch redemptions
      const { data: redemptionsData } = await supabase
        .from('rewards_redemptions' as any)
        .select(`
          *,
          rewards_catalog(name, name_ar)
        `)
        .eq('client_id', clientId)
        .order('redeemed_at', { ascending: false })
        .limit(10);

      setRedemptions((redemptionsData as any) || []);

    } catch (error) {
      console.error('Error fetching points data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rewards data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemClick = (reward: Reward) => {
    if (pointsBalance.total_points < reward.points_cost) {
      toast({
        title: 'Insufficient Points',
        description: `You need ${reward.points_cost - pointsBalance.total_points} more points to redeem this reward.`,
        variant: 'destructive',
      });
      return;
    }

    if (reward.stock_quantity !== null && reward.stock_quantity !== undefined && reward.stock_quantity <= 0) {
      toast({
        title: 'Out of Stock',
        description: 'This reward is currently out of stock.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedReward(reward);
    setShowConfirmDialog(true);
  };

  const confirmRedemption = async () => {
    if (!selectedReward) return;

    try {
      setRedeeming(true);

      const { data, error } = await supabase.rpc('redeem_reward' as any, {
        p_client_id: clientId,
        p_reward_id: selectedReward.id,
      });

      if (error) throw error;

      const result = data as any;

      if (result.success) {
        toast({
          title: '🎉 Reward Redeemed!',
          description: result.message,
        });

        // Refresh data
        await fetchPointsData();
        setShowConfirmDialog(false);
        setSelectedReward(null);
      } else {
        toast({
          title: 'Redemption Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast({
        title: 'Error',
        description: 'Failed to redeem reward. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRedeeming(false);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'free_item':
        return <Gift className="h-5 w-5" />;
      case 'discount':
        return <Percent className="h-5 w-5" />;
      case 'upgrade':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points Balance Card */}
      <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Coins className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Points</p>
                <p className="text-4xl font-bold text-primary">{pointsBalance.total_points}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime: {pointsBalance.lifetime_points} points
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="text-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Earn 1 pt per {formatCurrency(10)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Rewards and History */}
      <Tabs defaultValue="rewards" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="rewards" className="text-xs sm:text-sm">
            <ShoppingBag className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Rewards</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="text-xs sm:text-sm">
            <Award className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Badges</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-xs sm:text-sm">
            <Trophy className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Rank</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">
            <History className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="redemptions" className="text-xs sm:text-sm">
            <Gift className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Claimed</span>
          </TabsTrigger>
        </TabsList>

        {/* Achievement Badges */}
        <TabsContent value="badges">
          <AchievementBadges clientId={clientId} />
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard">
          <PointsLeaderboard clientId={clientId} />
        </TabsContent>

        {/* Rewards Catalog */}
        <TabsContent value="rewards" className="space-y-4">
          {rewards.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No rewards available at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rewards.map((reward) => {
                const canAfford = pointsBalance.total_points >= reward.points_cost;
                const inStock = reward.stock_quantity === null || reward.stock_quantity > 0;

                return (
                  <Card
                    key={reward.id}
                    className={`transition-all hover:shadow-md ${
                      canAfford && inStock ? 'hover:border-primary/50' : 'opacity-60'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {getRewardIcon(reward.reward_type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {reward.name}
                            </CardTitle>
                            <CardDescription>
                              {reward.description}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-primary font-bold text-xl">
                            <Coins className="h-5 w-5" />
                            {reward.points_cost}
                          </div>
                          {reward.stock_quantity !== null && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Stock: {reward.stock_quantity}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        onClick={() => handleRedeemClick(reward)}
                        disabled={!canAfford || !inStock}
                        variant={canAfford && inStock ? 'default' : 'outline'}
                      >
                        {!canAfford && `Need ${reward.points_cost - pointsBalance.total_points} more points`}
                        {canAfford && !inStock && 'Out of Stock'}
                        {canAfford && inStock && 'Redeem Now'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Points History */}
        <TabsContent value="history" className="space-y-3">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No points history yet</p>
              </CardContent>
            </Card>
          ) : (
            transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          transaction.points_amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.points_amount > 0 ? '+' : ''}
                        {transaction.points_amount}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transaction.transaction_type}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* My Redemptions */}
        <TabsContent value="redemptions" className="space-y-3">
          {redemptions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No redeemed rewards yet</p>
              </CardContent>
            </Card>
          ) : (
            redemptions.map((redemption) => (
              <Card key={redemption.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(redemption.status)}
                      <div>
                        <p className="font-medium">
                          {redemption.rewards_catalog?.name || 'Reward'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(redemption.redeemed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        -{redemption.points_spent} pts
                      </p>
                      <Badge
                        variant={
                          redemption.status === 'completed'
                            ? 'default'
                            : redemption.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-xs"
                      >
                        {redemption.status}
                      </Badge>
                    </div>
                  </div>
                  {redemption.status === 'pending' && (
                    <div className="mt-3 p-2 bg-yellow-500/10 rounded-md border border-yellow-500/20">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        Show this to reception staff to claim your reward
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this reward?
            </DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold text-lg">{selectedReward.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedReward.description}
                </p>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">Points to redeem:</span>
                <span className="text-lg font-bold text-primary flex items-center gap-1">
                  <Coins className="h-5 w-5" />
                  {selectedReward.points_cost}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Remaining points:</span>
                <span className="text-lg font-bold">
                  {pointsBalance.total_points - selectedReward.points_cost}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={redeeming}
            >
              Cancel
            </Button>
            <Button onClick={confirmRedemption} disabled={redeeming}>
              {redeeming ? 'Redeeming...' : 'Confirm Redemption'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
