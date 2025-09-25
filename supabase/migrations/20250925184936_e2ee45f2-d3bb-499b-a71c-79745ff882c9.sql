-- Update barcode generation function to create shorter barcodes (6 characters max)
CREATE OR REPLACE FUNCTION public.generate_unique_barcode()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_barcode TEXT;
    barcode_exists BOOLEAN;
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars like 0, O, 1, I
    barcode_length INTEGER := 6;
    i INTEGER;
BEGIN
    LOOP
        -- Generate 6-character barcode with mix of letters and numbers
        new_barcode := '';
        FOR i IN 1..barcode_length LOOP
            new_barcode := new_barcode || SUBSTRING(chars FROM (FLOOR(RANDOM() * LENGTH(chars)) + 1)::INTEGER FOR 1);
        END LOOP;
        
        -- Check if barcode already exists
        SELECT EXISTS(SELECT 1 FROM public.clients WHERE barcode = new_barcode) INTO barcode_exists;
        
        -- If unique, return it
        IF NOT barcode_exists THEN
            RETURN new_barcode;
        END IF;
    END LOOP;
END;
$function$;