-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can create their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Staff can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Staff can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Staff can delete reservations" ON public.reservations;
DROP POLICY IF EXISTS "Clients can view their own reservations" ON public.reservations;

-- Drop the existing foreign key constraint
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS reservations_user_id_fkey;

-- Delete any orphaned reservations
DELETE FROM public.reservations 
WHERE user_id NOT IN (SELECT id FROM public.clients);

-- Rename the column
ALTER TABLE public.reservations 
RENAME COLUMN user_id TO client_id;

-- Add the new foreign key constraint
ALTER TABLE public.reservations 
ADD CONSTRAINT reservations_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES public.clients(id) 
ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_reservations_client_id 
ON public.reservations(client_id);

-- Create fresh RLS policies
CREATE POLICY "Clients can view their own reservations" 
ON public.reservations 
FOR SELECT 
USING (client_id = auth.uid() OR is_current_user_staff());

CREATE POLICY "Staff can create reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (is_current_user_staff());

CREATE POLICY "Staff can update reservations" 
ON public.reservations 
FOR UPDATE 
USING (is_current_user_staff());

CREATE POLICY "Staff can delete reservations" 
ON public.reservations 
FOR DELETE 
USING (is_current_user_staff());