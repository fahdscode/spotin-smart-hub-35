import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Award, Plus, Pencil, Trash2, Trophy, ShoppingBag, 
  Coffee, Heart, Star, Coins, PiggyBank, MapPin, 
  Home, Building, Wallet, Gem, Calendar, Users, Save
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
  is_active: boolean;
  display_order: number;
}

const iconOptions = [
  { value: 'award', label: 'Award', Icon: Award },
  { value: 'trophy', label: 'Trophy', Icon: Trophy },
  { value: 'shopping-bag', label: 'Shopping Bag', Icon: ShoppingBag },
  { value: 'coffee', label: 'Coffee', Icon: Coffee },
  { value: 'heart', label: 'Heart', Icon: Heart },
  { value: 'star', label: 'Star', Icon: Star },
  { value: 'coins', label: 'Coins', Icon: Coins },
  { value: 'piggy-bank', label: 'Piggy Bank', Icon: PiggyBank },
  { value: 'map-pin', label: 'Map Pin', Icon: MapPin },
  { value: 'home', label: 'Home', Icon: Home },
  { value: 'building', label: 'Building', Icon: Building },
  { value: 'wallet', label: 'Wallet', Icon: Wallet },
  { value: 'gem', label: 'Gem', Icon: Gem },
  { value: 'calendar', label: 'Calendar', Icon: Calendar },
  { value: 'users', label: 'Users', Icon: Users },
];

const colorOptions = [
  { value: 'bg-amber-500', label: 'Gold' },
  { value: 'bg-blue-500', label: 'Blue' },
  { value: 'bg-green-500', label: 'Green' },
  { value: 'bg-purple-500', label: 'Purple' },
  { value: 'bg-red-500', label: 'Red' },
  { value: 'bg-pink-500', label: 'Pink' },
  { value: 'bg-orange-500', label: 'Orange' },
  { value: 'bg-teal-500', label: 'Teal' },
  { value: 'bg-indigo-500', label: 'Indigo' },
  { value: 'bg-rose-500', label: 'Rose' },
];

const categoryOptions = [
  { value: 'orders', label: 'Orders' },
  { value: 'points', label: 'Points' },
  { value: 'visits', label: 'Visits' },
  { value: 'spending', label: 'Spending' },
  { value: 'events', label: 'Events' },
  { value: 'general', label: 'General' },
];

const requirementTypeOptions = [
  { value: 'orders_count', label: 'Number of Orders' },
  { value: 'points_earned', label: 'Points Earned' },
  { value: 'visits_count', label: 'Number of Visits' },
  { value: 'spending_total', label: 'Total Spending (EGP)' },
  { value: 'events_attended', label: 'Events Attended' },
];

const emptyAchievement: Omit<Achievement, 'id'> = {
  name: '',
  name_ar: '',
  description: '',
  description_ar: '',
  icon: 'award',
  badge_color: 'bg-amber-500',
  category: 'general',
  requirement_type: 'orders_count',
  requirement_value: 1,
  points_reward: 0,
  is_active: true,
  display_order: 0,
};

const AchievementsManagement = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState<Omit<Achievement, 'id'>>(emptyAchievement);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load achievements',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAchievement(null);
    setFormData({ ...emptyAchievement, display_order: achievements.length });
    setDialogOpen(true);
  };

  const handleOpenEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setFormData({
      name: achievement.name,
      name_ar: achievement.name_ar || '',
      description: achievement.description,
      description_ar: achievement.description_ar || '',
      icon: achievement.icon,
      badge_color: achievement.badge_color,
      category: achievement.category,
      requirement_type: achievement.requirement_type,
      requirement_value: achievement.requirement_value,
      points_reward: achievement.points_reward,
      is_active: achievement.is_active,
      display_order: achievement.display_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description) {
      toast({
        title: 'Validation Error',
        description: 'Name and description are required',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      if (editingAchievement) {
        const { error } = await supabase
          .from('achievements')
          .update({
            name: formData.name,
            name_ar: formData.name_ar || null,
            description: formData.description,
            description_ar: formData.description_ar || null,
            icon: formData.icon,
            badge_color: formData.badge_color,
            category: formData.category,
            requirement_type: formData.requirement_type,
            requirement_value: formData.requirement_value,
            points_reward: formData.points_reward,
            is_active: formData.is_active,
            display_order: formData.display_order,
          })
          .eq('id', editingAchievement.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Achievement updated successfully' });
      } else {
        const { error } = await supabase
          .from('achievements')
          .insert({
            name: formData.name,
            name_ar: formData.name_ar || null,
            description: formData.description,
            description_ar: formData.description_ar || null,
            icon: formData.icon,
            badge_color: formData.badge_color,
            category: formData.category,
            requirement_type: formData.requirement_type,
            requirement_value: formData.requirement_value,
            points_reward: formData.points_reward,
            is_active: formData.is_active,
            display_order: formData.display_order,
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'Achievement created successfully' });
      }

      setDialogOpen(false);
      fetchAchievements();
    } catch (error) {
      console.error('Error saving achievement:', error);
      toast({
        title: 'Error',
        description: 'Failed to save achievement',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;

    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Achievement deleted successfully' });
      fetchAchievements();
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete achievement',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('achievements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchAchievements();
    } catch (error) {
      console.error('Error toggling achievement:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const found = iconOptions.find(opt => opt.value === iconName);
    return found ? found.Icon : Award;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Achievements Management</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage client achievement badges
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Achievement
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{achievements.length}</div>
            <p className="text-sm text-muted-foreground">Total Badges</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {achievements.filter(a => a.is_active).length}
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">
              {achievements.reduce((sum, a) => sum + a.points_reward, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Points Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {new Set(achievements.map(a => a.category)).size}
            </div>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map(achievement => {
          const IconComponent = getIconComponent(achievement.icon);
          return (
            <Card key={achievement.id} className={!achievement.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${achievement.badge_color} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{achievement.name}</CardTitle>
                      {achievement.name_ar && (
                        <p className="text-sm text-muted-foreground" dir="rtl">
                          {achievement.name_ar}
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={achievement.is_active}
                    onCheckedChange={() => handleToggleActive(achievement.id, achievement.is_active)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {achievement.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {categoryOptions.find(c => c.value === achievement.category)?.label}
                  </Badge>
                  <Badge variant="secondary">
                    {requirementTypeOptions.find(r => r.value === achievement.requirement_type)?.label}: {achievement.requirement_value}
                  </Badge>
                  {achievement.points_reward > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">
                      <Coins className="h-3 w-3 mr-1" />
                      +{achievement.points_reward} pts
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(achievement)}>
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(achievement.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {achievements.length === 0 && (
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No Achievements Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first achievement badge to reward clients
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Achievement
          </Button>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAchievement ? 'Edit Achievement' : 'Create New Achievement'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (English) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="First Order"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ar">Name (Arabic)</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={e => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                  placeholder="أول طلب"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Description Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description (English) *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Place your first order"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_ar">Description (Arabic)</Label>
                <Textarea
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={e => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                  placeholder="قم بأول طلب لك"
                  dir="rtl"
                  rows={2}
                />
              </div>
            </div>

            {/* Icon and Color */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={formData.icon} onValueChange={v => setFormData(prev => ({ ...prev, icon: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.Icon className="h-4 w-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Badge Color</Label>
                <Select value={formData.badge_color} onValueChange={v => setFormData(prev => ({ ...prev, badge_color: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-4 w-4 rounded-full ${opt.value}`} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category and Requirement Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Requirement Type</Label>
                <Select value={formData.requirement_type} onValueChange={v => setFormData(prev => ({ ...prev, requirement_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {requirementTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Requirement Value and Points Reward */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requirement_value">Requirement Value *</Label>
                <Input
                  id="requirement_value"
                  type="number"
                  min={1}
                  value={formData.requirement_value}
                  onChange={e => setFormData(prev => ({ ...prev, requirement_value: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points_reward">Points Reward</Label>
                <Input
                  id="points_reward"
                  type="number"
                  min={0}
                  value={formData.points_reward}
                  onChange={e => setFormData(prev => ({ ...prev, points_reward: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min={0}
                  value={formData.display_order}
                  onChange={e => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${formData.badge_color} text-white`}>
                  {(() => {
                    const IconComponent = getIconComponent(formData.icon);
                    return <IconComponent className="h-6 w-6" />;
                  })()}
                </div>
                <div>
                  <p className="font-medium">{formData.name || 'Achievement Name'}</p>
                  <p className="text-sm text-muted-foreground">{formData.description || 'Achievement description'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Achievement'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AchievementsManagement;
