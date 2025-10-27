import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Save, Trash2, ExternalLink, GripVertical } from 'lucide-react';

interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
  icon_name: string;
  is_active: boolean;
  display_order: number;
}

export default function MarketingDashboard() {
  const [links, setLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_links')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching links:', error);
      toast({
        title: 'Error',
        description: 'Failed to load social media links',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (link: SocialMediaLink) => {
    try {
      const { error } = await supabase
        .from('social_media_links')
        .update({
          platform: link.platform,
          url: link.url,
          icon_name: link.icon_name,
          is_active: link.is_active,
          display_order: link.display_order,
        })
        .eq('id', link.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Social media link updated successfully',
      });
      setEditingId(null);
      fetchLinks();
    } catch (error) {
      console.error('Error updating link:', error);
      toast({
        title: 'Error',
        description: 'Failed to update link',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('social_media_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Social media link deleted successfully',
      });
      fetchLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete link',
        variant: 'destructive',
      });
    }
  };

  const handleAdd = async () => {
    try {
      const maxOrder = Math.max(...links.map(l => l.display_order), 0);
      const { error } = await supabase
        .from('social_media_links')
        .insert({
          platform: 'New Platform',
          url: 'https://example.com',
          icon_name: 'Globe',
          is_active: false,
          display_order: maxOrder + 1,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'New social media link added',
      });
      fetchLinks();
    } catch (error) {
      console.error('Error adding link:', error);
      toast({
        title: 'Error',
        description: 'Failed to add link',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (link: SocialMediaLink) => {
    try {
      const { error } = await supabase
        .from('social_media_links')
        .update({ is_active: !link.is_active })
        .eq('id', link.id);

      if (error) throw error;

      fetchLinks();
    } catch (error) {
      console.error('Error toggling link:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle link status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
            <p className="text-muted-foreground">Manage social media links displayed in client portal</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Social Media Links</CardTitle>
            <CardDescription>
              These links will appear in a floating button on the client portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                
                {editingId === link.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`platform-${link.id}`}>Platform</Label>
                      <Input
                        id={`platform-${link.id}`}
                        value={link.platform}
                        onChange={(e) =>
                          setLinks(
                            links.map((l) =>
                              l.id === link.id ? { ...l, platform: e.target.value } : l
                            )
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`url-${link.id}`}>URL</Label>
                      <Input
                        id={`url-${link.id}`}
                        value={link.url}
                        onChange={(e) =>
                          setLinks(
                            links.map((l) =>
                              l.id === link.id ? { ...l, url: e.target.value } : l
                            )
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`icon-${link.id}`}>Icon Name</Label>
                      <Input
                        id={`icon-${link.id}`}
                        value={link.icon_name}
                        onChange={(e) =>
                          setLinks(
                            links.map((l) =>
                              l.id === link.id ? { ...l, icon_name: e.target.value } : l
                            )
                          )
                        }
                        placeholder="e.g., Facebook, Instagram"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-4">
                    <div>
                      <div className="font-semibold">{link.platform}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {link.url}
                        </a>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Icon: {link.icon_name}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${link.id}`} className="text-sm">
                      {link.is_active ? 'Active' : 'Inactive'}
                    </Label>
                    <Switch
                      id={`active-${link.id}`}
                      checked={link.is_active}
                      onCheckedChange={() => toggleActive(link)}
                    />
                  </div>

                  {editingId === link.id ? (
                    <Button size="sm" onClick={() => handleUpdate(link)}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(link.id)}
                    >
                      Edit
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(link.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {links.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No social media links yet. Click "Add Link" to create one.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How the floating button will appear to clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 bg-muted/20 rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Active links: {links.filter(l => l.is_active).length}
              </p>
              <div className="absolute bottom-4 right-4">
                <Badge variant="secondary">Floating Button Position</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
