-- Fix security vulnerabilities by restricting public access to rooms and traffic_data tables

-- Drop the existing public policies for rooms table
DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON public.rooms;

-- Create new restricted policy for rooms - only authenticated users can view
CREATE POLICY "Authenticated users can view rooms" 
ON public.rooms 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow staff to manage rooms
CREATE POLICY "Staff can manage rooms" 
ON public.rooms 
FOR ALL 
TO authenticated 
USING (is_admin_or_staff());

-- Drop the existing public policy for traffic_data table  
DROP POLICY IF EXISTS "Traffic data is viewable by everyone" ON public.traffic_data;

-- Create new restricted policy for traffic_data - only authenticated users can view
CREATE POLICY "Authenticated users can view traffic data" 
ON public.traffic_data 
FOR SELECT 
TO authenticated 
USING (true);