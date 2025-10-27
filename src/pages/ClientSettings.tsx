import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SpotinHeader from '@/components/SpotinHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Lock, User, Mail, Phone, Shield, Trash2, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RTLWrapper from '@/components/RTLWrapper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ClientSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clientData, isAuthenticated, clearClientAuth } = useAuth();
  const { t } = useTranslation();
  
  // Profile Settings
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [eventNotifications, setEventNotifications] = useState(true);
  
  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Delete Account Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !clientData) {
      navigate('/client-login');
      return;
    }
    
    // Load client data
    setFullName(clientData.full_name || '');
    setEmail(clientData.email || '');
    setPhone(clientData.phone || '');
  }, [isAuthenticated, clientData, navigate]);

  const handleUpdateProfile = async () => {
    if (!clientData?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          full_name: fullName,
          email: email,
          phone: phone,
        })
        .eq('id', clientData.id);

      if (error) throw error;

      toast({
        title: t('clientSettings.profileUpdated'),
        description: t('clientSettings.profileUpdateSuccess'),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('clientSettings.error'),
        description: t('clientSettings.failedToUpdate'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: t('clientSettings.error'),
        description: t('clientSettings.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('clientSettings.error'),
        description: t('clientSettings.passwordsDontMatch'),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('clientSettings.error'),
        description: t('clientSettings.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Call edge function to change password
      const { error } = await supabase.functions.invoke('auth-helpers', {
        body: {
          action: 'password-reset',
          phone: clientData?.phone,
          newPassword: newPassword,
        },
      });

      if (error) throw error;

      toast({
        title: t('clientSettings.passwordChanged'),
        description: t('clientSettings.passwordChangeSuccess'),
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: t('clientSettings.error'),
        description: t('clientSettings.failedToChangePassword'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!clientData?.id) return;
    
    setLoading(true);
    try {
      // In a real implementation, you would call an edge function to properly delete the account
      toast({
        title: t('clientSettings.accountDeletionRequested'),
        description: t('clientSettings.contactSupportToDelete'),
      });
      
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: t('clientSettings.error'),
        description: t('clientSettings.failedToDelete'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <RTLWrapper>
      <div className="min-h-screen bg-background">
        <SpotinHeader />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/client')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('clientSettings.backToDashboard')}
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t('clientSettings.title')}</h1>
            <p className="text-muted-foreground">{t('clientSettings.subtitle')}</p>
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('clientSettings.profileInfo')}
              </CardTitle>
              <CardDescription>{t('clientSettings.updatePersonalInfo')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('clientSettings.fullName')}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('clientSettings.fullName')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('clientSettings.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('clientSettings.email')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('clientSettings.phone')}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('clientSettings.phone')}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  {t('clientSettings.contactSupport')}
                </p>
              </div>

              <Button onClick={handleUpdateProfile} disabled={loading}>
                {t('clientSettings.saveChanges')}
              </Button>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('clientSettings.notificationPreferences')}
              </CardTitle>
              <CardDescription>{t('clientSettings.chooseNotifications')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('clientSettings.emailNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('clientSettings.emailNotificationsDesc')}
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('clientSettings.orderUpdates')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('clientSettings.orderUpdatesDesc')}
                  </p>
                </div>
                <Switch
                  checked={orderNotifications}
                  onCheckedChange={setOrderNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('clientSettings.eventNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('clientSettings.eventNotificationsDesc')}
                  </p>
                </div>
                <Switch
                  checked={eventNotifications}
                  onCheckedChange={setEventNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t('clientSettings.security')}
              </CardTitle>
              <CardDescription>{t('clientSettings.securityDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('clientSettings.currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('clientSettings.currentPassword')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('clientSettings.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('clientSettings.newPassword')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('clientSettings.confirmNewPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('clientSettings.confirmNewPassword')}
                />
              </div>

              <Button onClick={handleChangePassword} disabled={loading}>
                {t('clientSettings.changePassword')}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" />
                {t('clientSettings.dangerZone')}
              </CardTitle>
              <CardDescription>{t('clientSettings.irreversibleActions')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('clientSettings.deleteAccountWarning')}
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('clientSettings.deleteAccount')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('clientSettings.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('clientSettings.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('clientSettings.deleteAccount')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </RTLWrapper>
  );
}
