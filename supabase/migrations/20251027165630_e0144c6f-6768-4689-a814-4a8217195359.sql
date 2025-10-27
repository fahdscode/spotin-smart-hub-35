-- Enable real-time for tables that aren't already added
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.drinks REPLICA IDENTITY FULL;
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.event_registrations REPLICA IDENTITY FULL;
ALTER TABLE public.check_ins REPLICA IDENTITY FULL;
ALTER TABLE public.cashier_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.social_media_links REPLICA IDENTITY FULL;

-- Try to add tables to realtime publication (some may already exist)
DO $$
BEGIN
  -- Only add if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'clients'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'drinks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.drinks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'event_registrations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'check_ins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'cashier_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cashier_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'social_media_links'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_media_links;
  END IF;
END $$;