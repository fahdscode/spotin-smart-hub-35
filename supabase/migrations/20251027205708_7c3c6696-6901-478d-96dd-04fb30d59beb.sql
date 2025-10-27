-- Enable pgcrypto extension for password hashing
-- This is required for the gen_salt and crypt functions used in client registration

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify the extension is available
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE EXCEPTION 'pgcrypto extension could not be enabled';
  END IF;
  RAISE NOTICE 'pgcrypto extension successfully enabled';
END $$;