import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Crown, Star, Zap, Gift, TrendingUp, CheckCircle2, Sparkles, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocalizedFields } from '@/hooks/useLocalizedFields';
import { formatCurrency } from '@/lib/currency';
import { useTranslation } from 'react-i18next';
import RewardsShop from './RewardsShop';

interface MembershipPlan {
  id: string;
  plan_name: string;
  plan_name_ar?: string;
  description: string;
  description_ar?: string;
  price: number;
  discount_percentage: number;
  duration_months: number;
  includes_free_pass: boolean;
  perks: string[];
}

interface ClientMembership {
  id: string;
  plan_name: string;
  discount_percentage: number;
  perks: string[];
  total_savings: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

interface LoyaltyProgramProps {
  clientId: string;
}

export default function LoyaltyProgram({ clientId }: LoyaltyProgramProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { getMembershipName, getMembershipDescription } = useLocalizedFields();
  const [currentMembership, setCurrentMembership] = useState<ClientMembership | null>(null);
  const [availablePlans, setAvailablePlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    fetchLoyaltyData();
  }, [clientId]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);

      // Fetch current membership
      const { data: membershipData } = await supabase
        .from('client_memberships')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle();

      setCurrentMembership(membershipData);

      // Fetch available plans
      const { data: plansData } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      setAvailablePlans(plansData || []);

      // Calculate total spent
      const { data: ordersData } = await supabase
        .from('session_line_items')
        .select('price, quantity')
        .eq('user_id', clientId)
        .in('status', ['completed', 'served']);

      const total = ordersData?.reduce((sum, order) => sum + (order.price * order.quantity), 0) || 0;
      setTotalSpent(total);

    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load loyalty program data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('gold') || name.includes('vip')) return <Crown className="h-5 w-5" />;
    if (name.includes('silver')) return <Award className="h-5 w-5" />;
    return <Star className="h-5 w-5" />;
  };

  const getPlanColor = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('gold')) return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    if (name.includes('vip')) return 'from-purple-500/20 to-pink-500/20 border-purple-500/30';
    if (name.includes('silver')) return 'from-slate-500/20 to-gray-500/20 border-slate-500/30';
    return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
  };

  const getBadgeVariant = (planName: string): "default" | "secondary" | "destructive" | "outline" => {
    const name = planName.toLowerCase();
    if (name.includes('gold') || name.includes('vip')) return 'default';
    if (name.includes('silver')) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-muted rounded-lg" />
        <div className="h-60 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs for Membership and Points */}
      <Tabs defaultValue="membership" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="membership">
            <Award className="h-4 w-4 mr-2" />
            Membership
          </TabsTrigger>
          <TabsTrigger value="points">
            <Coins className="h-4 w-4 mr-2" />
            Points & Rewards
          </TabsTrigger>
        </TabsList>

        {/* Membership Tab */}
        <TabsContent value="membership" className="space-y-6">
          {/* Current Membership Status */}
          {currentMembership ? (
            <Card className={`bg-gradient-to-br ${getPlanColor(currentMembership.plan_name)} border-2`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPlanIcon(currentMembership.plan_name)}
                    <div>
                      <CardTitle className="text-xl">{currentMembership.plan_name}</CardTitle>
                      <CardDescription>Active Membership</CardDescription>
                    </div>
                  </div>
                  <Badge variant={getBadgeVariant(currentMembership.plan_name)} className="text-sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Discount</p>
                    <p className="text-2xl font-bold text-primary">
                      {currentMembership.discount_percentage}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Savings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(currentMembership.total_savings)}
                    </p>
                  </div>
                </div>

                {currentMembership.perks && currentMembership.perks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Member Benefits:</p>
                    <div className="space-y-1">
                      {currentMembership.perks.map((perk, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-muted-foreground">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentMembership.end_date && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Valid until: {new Date(currentMembership.end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Gift className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Join Our Loyalty Program</CardTitle>
                    <CardDescription>Start saving on every visit!</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <p className="text-sm">Total Spent: <span className="font-bold">{formatCurrency(totalSpent)}</span></p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose a membership plan below to unlock exclusive discounts and benefits!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Available Plans */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {currentMembership ? 'Upgrade Your Plan' : 'Available Plans'}
            </h3>
            
            <div className="grid gap-4">
              {availablePlans.map((plan) => {
                const isCurrentPlan = currentMembership?.plan_name === plan.plan_name;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`transition-all hover:shadow-md ${
                      isCurrentPlan 
                        ? 'border-2 border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPlanIcon(plan.plan_name)}
                          <CardTitle className="text-lg">
                            {getMembershipName(plan)}
                          </CardTitle>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(plan.price)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            /{plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}
                          </p>
                        </div>
                      </div>
                      <CardDescription className="text-sm">
                        {getMembershipDescription(plan)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="text-sm">
                          {plan.discount_percentage}% Discount
                        </Badge>
                        {plan.includes_free_pass && (
                          <Badge variant="outline" className="text-sm">
                            <Gift className="h-3 w-3 mr-1" />
                            Free Day Pass
                          </Badge>
                        )}
                      </div>

                      {plan.perks && plan.perks.length > 0 && (
                        <div className="space-y-1">
                          {plan.perks.map((perk, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                              <span className="text-muted-foreground">{perk}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!isCurrentPlan && (
                        <Button 
                          className="w-full mt-2" 
                          variant={plan.price === 0 ? 'outline' : 'default'}
                          onClick={() => {
                            toast({
                              title: 'Contact Reception',
                              description: 'Please visit our reception desk to activate this membership plan.',
                            });
                          }}
                        >
                          {currentMembership ? 'Upgrade to This Plan' : 'Choose This Plan'}
                        </Button>
                      )}
                      
                      {isCurrentPlan && (
                        <div className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          Your Current Plan
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {currentMembership && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-sm text-center text-muted-foreground">
                  Want to upgrade or change your plan? Visit the reception desk or contact our team for assistance.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Points & Rewards Tab */}
        <TabsContent value="points">
          <RewardsShop clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
