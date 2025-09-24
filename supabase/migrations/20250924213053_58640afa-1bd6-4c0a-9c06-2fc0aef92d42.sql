-- Create function to generate unique UUID-based barcodes
CREATE OR REPLACE FUNCTION public.generate_unique_barcode()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_barcode TEXT;
    barcode_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate barcode format: BC-{first 8 chars of UUID}-{6 digit number}
        new_barcode := 'BC-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)) || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Check if barcode already exists
        SELECT EXISTS(SELECT 1 FROM public.clients WHERE barcode = new_barcode) INTO barcode_exists;
        
        -- If unique, return it
        IF NOT barcode_exists THEN
            RETURN new_barcode;
        END IF;
    END LOOP;
END;
$$;