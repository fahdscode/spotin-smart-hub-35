-- Production Reset: Clear all test data while keeping essential configurations
-- This migration removes all client data, orders, receipts, and logs
-- but preserves admin users, products, and system configurations

-- Clear client-related data
DELETE FROM public.client_tickets;
DELETE FROM public.client_memberships;
DELETE FROM public.event_registrations;
DELETE FROM public.reservations;
DELETE FROM public.session_line_items;
DELETE FROM public.receipts;
DELETE FROM public.check_ins;
DELETE FROM public.check_in_logs;
DELETE FROM public.clients;

-- Clear operational data
DELETE FROM public.cashier_sessions;
DELETE FROM public.feedback;
DELETE FROM public.login_attempts;
DELETE FROM public.password_reset_tokens;

-- Clear bills and related data
DELETE FROM public.bill_line_items;
DELETE FROM public.bills;

-- Clear events
DELETE FROM public.events;

-- Clear traffic data
DELETE FROM public.traffic_data;

-- Reset stock quantities to zero (ready for actual inventory)
UPDATE public.stock 
SET current_quantity = 0, 
    updated_at = now()
WHERE is_active = true;