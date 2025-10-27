-- Add Arabic language fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS title_ar TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Add Arabic language fields to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS name_ar TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT;

COMMENT ON COLUMN public.events.title_ar IS 'Arabic title for the event';
COMMENT ON COLUMN public.events.description_ar IS 'Arabic description for the event';
COMMENT ON COLUMN public.rooms.name_ar IS 'Arabic name for the room';
COMMENT ON COLUMN public.rooms.description_ar IS 'Arabic description for the room';