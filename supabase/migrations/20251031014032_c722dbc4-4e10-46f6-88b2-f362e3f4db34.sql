-- Add 'ready' status to session_line_items check constraint
ALTER TABLE session_line_items 
DROP CONSTRAINT IF EXISTS session_line_items_status_check;

ALTER TABLE session_line_items 
ADD CONSTRAINT session_line_items_status_check 
CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'served', 'cancelled'));