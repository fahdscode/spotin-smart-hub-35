-- ============================================
-- PRODUCTION DATA CLEANUP - CLEAR ALL TEST DATA
-- Keeps: Admin accounts only
-- Deletes: All client data, transactions, and configurations
-- ============================================

-- Delete in correct order to respect foreign key constraints

-- 1. Clear event registrations first (references events and clients)
DELETE FROM public.event_registrations;

-- 2. Clear check-ins (references clients)
DELETE FROM public.check_ins;

-- 3. Clear check-in logs (references clients)
DELETE FROM public.check_in_logs;

-- 4. Clear client tickets (references clients)
DELETE FROM public.client_tickets;

-- 5. Clear client memberships (references clients)
DELETE FROM public.client_memberships;

-- 6. Clear session line items (references clients via user_id)
DELETE FROM public.session_line_items;

-- 7. Clear receipts (references clients via user_id)
DELETE FROM public.receipts;

-- 8. Clear reservations (references clients and rooms)
DELETE FROM public.reservations;

-- 9. Clear feedback (references clients via user_id)
DELETE FROM public.feedback;

-- 10. Clear user analytics (references clients via user_id)
DELETE FROM public.user_analytics;

-- 11. Clear password reset tokens (references clients)
DELETE FROM public.password_reset_tokens;

-- 12. Now safe to delete clients
DELETE FROM public.clients;

-- 13. Clear events
DELETE FROM public.events;

-- 14. Clear bill line items (references bills)
DELETE FROM public.bill_line_items;

-- 15. Clear bills
DELETE FROM public.bills;

-- 16. Clear financial data
DELETE FROM public.financial_transactions;
DELETE FROM public.budgets;
DELETE FROM public.payroll_transactions;
DELETE FROM public.payroll;

-- 17. Clear cashier sessions
DELETE FROM public.cashier_sessions;

-- 18. Clear product ingredients (references products and stock)
DELETE FROM public.product_ingredients;

-- 19. Clear products/drinks
DELETE FROM public.drinks;

-- 20. Clear categories
DELETE FROM public.categories;

-- 21. Clear stock
DELETE FROM public.stock;

-- 22. Clear rooms
DELETE FROM public.rooms;

-- 23. Clear membership plans
DELETE FROM public.membership_plans;

-- 24. Clear memberships
DELETE FROM public.memberships;

-- 25. Clear promotions
DELETE FROM public.promotions;

-- 26. Clear login attempts
DELETE FROM public.login_attempts;

-- 27. Clear system logs
DELETE FROM public.system_logs;

-- 28. Clear traffic data
DELETE FROM public.traffic_data;

-- 29. Clear social media links
DELETE FROM public.social_media_links;

-- 30. Clear expense categories
DELETE FROM public.expense_categories;