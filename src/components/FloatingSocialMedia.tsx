import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Instagram, Twitter, Linkedin, Globe, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
  icon_name: string;
  is_active: boolean;
  display_order: number;
}

const iconMap: Record<string, any> = {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Globe,
};

export default function FloatingSocialMedia() {
  const [links, setLinks] = useState<SocialMediaLink[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchLinks();

    // Set up real-time subscription
    const channel = supabase
      .channel('social-media-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_media_links',
        },
        () => {
          fetchLinks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_links')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching social media links:', error);
    }
  };

  if (links.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Social Media Links */}
      <div
        className={cn(
          "mb-3 flex flex-col gap-2 transition-all duration-300 origin-bottom",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}
      >
        {links.map((link) => {
          const IconComponent = iconMap[link.icon_name] || Globe;
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative"
            >
              <Button
                size="lg"
                className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all animate-fade-in"
                variant="secondary"
              >
                <IconComponent className="h-5 w-5" />
              </Button>
              <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-popover text-popover-foreground px-3 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none">
                {link.platform}
              </span>
            </a>
          );
        })}
      </div>

      {/* Toggle Button */}
      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Share2 className="h-6 w-6" />}
      </Button>
    </div>
  );
}
