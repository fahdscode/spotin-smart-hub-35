-- Fix RLS policies for event_registrations table to protect customer contact information

-- First, let's check the current policies and drop them if they exist
DROP POLICY IF EXISTS "Staff can manage event registrations" ON public.event_registrations;
DROP POLICY IF EXISTS "Staff can view all event registrations" ON public.event_registrations;

-- Create comprehensive RLS policies for event_registrations table

-- Policy 1: Only allow staff to view event registrations (protects personal data)
CREATE POLICY "Staff can view event registrations"
ON public.event_registrations
FOR SELECT
USING (is_admin_or_staff());

-- Policy 2: Only allow staff to create event registrations
CREATE POLICY "Staff can create event registrations"
ON public.event_registrations
FOR INSERT
WITH CHECK (is_admin_or_staff());

-- Policy 3: Only allow staff to update event registrations
CREATE POLICY "Staff can update event registrations"
ON public.event_registrations
FOR UPDATE
USING (is_admin_or_staff());

-- Policy 4: Only allow staff to delete event registrations
CREATE POLICY "Staff can delete event registrations"
ON public.event_registrations
FOR DELETE
USING (is_admin_or_staff());

-- Also ensure RLS is enabled on the table
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Let's also add a policy for clients to register for events themselves
-- This allows authenticated clients to create their own registrations
CREATE POLICY "Clients can register for events"
ON public.event_registrations
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND client_id = auth.uid()
);

-- Allow clients to view only their own registrations
CREATE POLICY "Clients can view their own registrations"
ON public.event_registrations
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND client_id = auth.uid()
);