-- PRODUCTION RESET: Delete test/transactional data, keep configuration
-- This prepares the system for production launch

-- Step 1: Delete transactional data (in correct order due to foreign keys)
DELETE FROM session_line_items;
DELETE FROM cashier_sessions;
DELETE FROM check_in_logs;
DELETE FROM check_ins;
DELETE FROM client_tickets;
DELETE FROM event_registrations;
DELETE FROM client_memberships;
DELETE FROM bills;
DELETE FROM receipts;
DELETE FROM feedback;
DELETE FROM reservations;
DELETE FROM clients;

-- Step 2: Fix CRITICAL Security Issues
-- Fix clients table RLS - restrict public access
DROP POLICY IF EXISTS "Clients can view own data by client ID" ON clients;
CREATE POLICY "Clients can view own data by client ID" 
ON clients FOR SELECT 
USING (auth.uid() = id OR is_admin_or_staff());

-- Fix client_tickets RLS - restrict to own tickets only
DROP POLICY IF EXISTS "Users can view their own tickets" ON client_tickets;
CREATE POLICY "Users can view their own tickets" 
ON client_tickets FOR SELECT 
USING (client_id = auth.uid() OR is_admin_or_staff());

-- Fix receipts RLS - restrict to own receipts
DROP POLICY IF EXISTS "Users can view receipts" ON receipts;
CREATE POLICY "Users can view own receipts" 
ON receipts FOR SELECT 
USING (user_id = auth.uid() OR is_admin_or_staff());

-- Fix session_line_items RLS - restrict to own orders
DROP POLICY IF EXISTS "Users can view line items" ON session_line_items;
CREATE POLICY "Users can view own orders" 
ON session_line_items FOR SELECT 
USING (user_id = auth.uid() OR is_admin_or_staff());

-- Fix categories table - restrict modifications to staff only
DROP POLICY IF EXISTS "Anyone can insert categories" ON categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON categories;

CREATE POLICY "Staff can insert categories" 
ON categories FOR INSERT 
WITH CHECK (is_admin_or_staff());

CREATE POLICY "Staff can update categories" 
ON categories FOR UPDATE 
USING (is_admin_or_staff());

CREATE POLICY "Staff can delete categories" 
ON categories FOR DELETE 
USING (is_admin_or_staff());

-- Step 3: Reset stock quantities to zero (keep items, reset counts)
UPDATE stock SET current_quantity = 0, updated_at = now();

-- Production readiness confirmation
COMMENT ON TABLE clients IS 'Production ready - test data cleared, RLS secured';
COMMENT ON TABLE receipts IS 'Production ready - test transactions cleared, RLS secured';