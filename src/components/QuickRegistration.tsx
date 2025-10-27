import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import bcrypt from 'bcryptjs';

interface QuickRegistrationProps {
  onSuccess?: () => void;
}

export const QuickRegistration = ({ onSuccess }: QuickRegistrationProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    jobTitle: '',
    howDidYouFindUs: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.jobTitle) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Hash password (or use default if not provided)
      const password = formData.password || 'Welcome123';
      const passwordHash = await bcrypt.hash(password, 10);

      // Call the registration function
      const { data, error } = await supabase.rpc('test_client_registration', {
        p_first_name: formData.firstName,
        p_last_name: formData.lastName,
        p_phone: formData.phone,
        p_email: formData.email || null,
        p_password_hash: passwordHash,
        p_job_title: formData.jobTitle,
        p_how_did_you_find_us: formData.howDidYouFindUs || 'Not specified'
      });

      if (error) throw error;

      const result = data as any;
      
      if (result.success) {
        toast.success(`Client registered successfully!`, {
          description: `Client code: ${result.client_code} | Barcode: ${result.barcode}`
        });
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          password: '',
          jobTitle: '',
          howDidYouFindUs: ''
        });
        
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to register client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="John"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Doe"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+20 123 456 7890"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email (optional)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john.doe@example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title *</Label>
        <Input
          id="jobTitle"
          value={formData.jobTitle}
          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
          placeholder="Software Engineer"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="howDidYouFindUs">How did you find us? (optional)</Label>
        <Select
          value={formData.howDidYouFindUs}
          onValueChange={(value) => setFormData({ ...formData, howDidYouFindUs: value })}
        >
          <SelectTrigger id="howDidYouFindUs">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="social_media">Social Media</SelectItem>
            <SelectItem value="friend_referral">Friend Referral</SelectItem>
            <SelectItem value="google_search">Google Search</SelectItem>
            <SelectItem value="walk_by">Walk By</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password (optional - default: Welcome123)</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Leave empty for default password"
        />
        <p className="text-xs text-muted-foreground">
          If left empty, default password "Welcome123" will be used
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Register Client
            </>
          )}
        </Button>
      </div>

      <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
        <p className="font-semibold mb-1">Note:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Client code and barcode will be generated automatically</li>
          <li>Client will be inactive by default until first check-in</li>
          <li>Share the credentials with the client after registration</li>
        </ul>
      </div>
    </form>
  );
};
