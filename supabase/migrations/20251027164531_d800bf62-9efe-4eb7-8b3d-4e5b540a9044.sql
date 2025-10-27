-- Create social_media_links table
CREATE TABLE IF NOT EXISTS public.social_media_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Social media links are viewable by everyone"
  ON public.social_media_links
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can manage social media links"
  ON public.social_media_links
  FOR ALL
  USING (is_admin_or_staff());

-- Create index for ordering
CREATE INDEX idx_social_media_links_order ON public.social_media_links(display_order);

-- Insert default social media links
INSERT INTO public.social_media_links (platform, url, icon_name, display_order) VALUES
  ('Facebook', 'https://facebook.com/spotin', 'Facebook', 1),
  ('Instagram', 'https://instagram.com/spotin', 'Instagram', 2),
  ('Twitter', 'https://twitter.com/spotin', 'Twitter', 3),
  ('LinkedIn', 'https://linkedin.com/company/spotin', 'Linkedin', 4);