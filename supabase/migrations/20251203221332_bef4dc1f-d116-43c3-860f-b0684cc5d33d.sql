
-- Achievements/Badges catalog
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT NOT NULL,
  description_ar TEXT,
  icon TEXT NOT NULL DEFAULT 'award',
  badge_color TEXT NOT NULL DEFAULT 'bg-primary',
  category TEXT NOT NULL DEFAULT 'general',
  requirement_type TEXT NOT NULL, -- 'orders_count', 'points_earned', 'visits_count', 'spending_total', 'events_attended', 'streak_days'
  requirement_value INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Client achievements (unlocked badges)
CREATE TABLE public.client_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  notified BOOLEAN DEFAULT false,
  UNIQUE(client_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Anyone can view active achievements" ON public.achievements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Staff can manage achievements" ON public.achievements
  FOR ALL USING (is_admin_or_staff());

-- RLS Policies for client_achievements
CREATE POLICY "Clients can view their own achievements" ON public.client_achievements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_achievements.client_id AND clients.is_active = true)
    OR is_admin_or_staff()
  );

CREATE POLICY "System can award achievements" ON public.client_achievements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients WHERE clients.id = client_achievements.client_id AND clients.is_active = true)
    OR is_admin_or_staff()
  );

CREATE POLICY "Staff can manage client achievements" ON public.client_achievements
  FOR ALL USING (is_admin_or_staff());

-- Function to check and award achievements for a client
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_client_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_orders_count INTEGER;
  v_points_earned INTEGER;
  v_visits_count INTEGER;
  v_spending_total NUMERIC;
  v_events_attended INTEGER;
  v_achievement RECORD;
  v_newly_unlocked UUID[] := '{}';
  v_points_awarded INTEGER := 0;
BEGIN
  -- Get client stats
  SELECT COUNT(*) INTO v_orders_count
  FROM session_line_items
  WHERE user_id = p_client_id AND status IN ('completed', 'served');
  
  SELECT COALESCE(lifetime_points, 0) INTO v_points_earned
  FROM client_points
  WHERE client_id = p_client_id;
  
  SELECT COUNT(*) INTO v_visits_count
  FROM check_ins
  WHERE client_id = p_client_id;
  
  SELECT COALESCE(SUM(price * quantity), 0) INTO v_spending_total
  FROM session_line_items
  WHERE user_id = p_client_id AND status IN ('completed', 'served');
  
  SELECT COUNT(*) INTO v_events_attended
  FROM event_registrations
  WHERE client_id = p_client_id AND attendance_status = 'attended';
  
  -- Check each achievement
  FOR v_achievement IN 
    SELECT a.* FROM achievements a
    WHERE a.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM client_achievements ca
      WHERE ca.client_id = p_client_id AND ca.achievement_id = a.id
    )
  LOOP
    -- Check if requirement is met
    IF (v_achievement.requirement_type = 'orders_count' AND v_orders_count >= v_achievement.requirement_value)
       OR (v_achievement.requirement_type = 'points_earned' AND COALESCE(v_points_earned, 0) >= v_achievement.requirement_value)
       OR (v_achievement.requirement_type = 'visits_count' AND v_visits_count >= v_achievement.requirement_value)
       OR (v_achievement.requirement_type = 'spending_total' AND v_spending_total >= v_achievement.requirement_value)
       OR (v_achievement.requirement_type = 'events_attended' AND v_events_attended >= v_achievement.requirement_value)
    THEN
      -- Award the achievement
      INSERT INTO client_achievements (client_id, achievement_id)
      VALUES (p_client_id, v_achievement.id);
      
      v_newly_unlocked := array_append(v_newly_unlocked, v_achievement.id);
      
      -- Award bonus points if any
      IF v_achievement.points_reward > 0 THEN
        -- Update client points
        INSERT INTO client_points (client_id, total_points, lifetime_points)
        VALUES (p_client_id, v_achievement.points_reward, v_achievement.points_reward)
        ON CONFLICT (client_id) DO UPDATE SET
          total_points = client_points.total_points + v_achievement.points_reward,
          lifetime_points = client_points.lifetime_points + v_achievement.points_reward;
        
        -- Log the points transaction
        INSERT INTO points_transactions (client_id, transaction_type, points, description, reference_type, reference_id)
        VALUES (p_client_id, 'bonus', v_achievement.points_reward, 'Achievement unlocked: ' || v_achievement.name, 'achievement', v_achievement.id);
        
        v_points_awarded := v_points_awarded + v_achievement.points_reward;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'newly_unlocked', v_newly_unlocked,
    'points_awarded', v_points_awarded,
    'stats', jsonb_build_object(
      'orders_count', v_orders_count,
      'points_earned', COALESCE(v_points_earned, 0),
      'visits_count', v_visits_count,
      'spending_total', v_spending_total,
      'events_attended', v_events_attended
    )
  );
END;
$$;

-- Function to get client achievements with progress
CREATE OR REPLACE FUNCTION public.get_client_achievements(p_client_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_orders_count INTEGER;
  v_points_earned INTEGER;
  v_visits_count INTEGER;
  v_spending_total NUMERIC;
  v_events_attended INTEGER;
  result jsonb;
BEGIN
  -- Get client stats
  SELECT COUNT(*) INTO v_orders_count
  FROM session_line_items
  WHERE user_id = p_client_id AND status IN ('completed', 'served');
  
  SELECT COALESCE(lifetime_points, 0) INTO v_points_earned
  FROM client_points
  WHERE client_id = p_client_id;
  
  SELECT COUNT(*) INTO v_visits_count
  FROM check_ins
  WHERE client_id = p_client_id;
  
  SELECT COALESCE(SUM(price * quantity), 0) INTO v_spending_total
  FROM session_line_items
  WHERE user_id = p_client_id AND status IN ('completed', 'served');
  
  SELECT COUNT(*) INTO v_events_attended
  FROM event_registrations
  WHERE client_id = p_client_id AND attendance_status = 'attended';
  
  -- Get all achievements with unlock status and progress
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'name', a.name,
      'name_ar', a.name_ar,
      'description', a.description,
      'description_ar', a.description_ar,
      'icon', a.icon,
      'badge_color', a.badge_color,
      'category', a.category,
      'requirement_type', a.requirement_type,
      'requirement_value', a.requirement_value,
      'points_reward', a.points_reward,
      'is_unlocked', ca.id IS NOT NULL,
      'unlocked_at', ca.unlocked_at,
      'current_progress', CASE a.requirement_type
        WHEN 'orders_count' THEN v_orders_count
        WHEN 'points_earned' THEN COALESCE(v_points_earned, 0)
        WHEN 'visits_count' THEN v_visits_count
        WHEN 'spending_total' THEN v_spending_total::INTEGER
        WHEN 'events_attended' THEN v_events_attended
        ELSE 0
      END
    ) ORDER BY ca.id IS NOT NULL DESC, a.display_order, a.requirement_value
  )
  INTO result
  FROM achievements a
  LEFT JOIN client_achievements ca ON a.id = ca.achievement_id AND ca.client_id = p_client_id
  WHERE a.is_active = true;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Insert sample achievements
INSERT INTO public.achievements (name, name_ar, description, description_ar, icon, badge_color, category, requirement_type, requirement_value, points_reward, display_order) VALUES
-- Order milestones
('First Order', 'أول طلب', 'Place your first order', 'قدم طلبك الأول', 'shopping-bag', 'bg-green-500', 'orders', 'orders_count', 1, 10, 1),
('Regular', 'منتظم', 'Complete 10 orders', 'أكمل 10 طلبات', 'coffee', 'bg-blue-500', 'orders', 'orders_count', 10, 25, 2),
('Loyal Customer', 'عميل مخلص', 'Complete 50 orders', 'أكمل 50 طلب', 'heart', 'bg-red-500', 'orders', 'orders_count', 50, 100, 3),
('Super Fan', 'معجب خارق', 'Complete 100 orders', 'أكمل 100 طلب', 'star', 'bg-yellow-500', 'orders', 'orders_count', 100, 250, 4),

-- Points milestones
('Point Starter', 'بداية النقاط', 'Earn your first 50 points', 'اربح أول 50 نقطة', 'coins', 'bg-amber-500', 'points', 'points_earned', 50, 5, 5),
('Point Collector', 'جامع النقاط', 'Earn 500 points', 'اربح 500 نقطة', 'piggy-bank', 'bg-pink-500', 'points', 'points_earned', 500, 50, 6),
('Point Master', 'سيد النقاط', 'Earn 2000 points', 'اربح 2000 نقطة', 'trophy', 'bg-purple-500', 'points', 'points_earned', 2000, 200, 7),

-- Visit milestones
('First Visit', 'أول زيارة', 'Check in for the first time', 'سجل دخولك لأول مرة', 'map-pin', 'bg-teal-500', 'visits', 'visits_count', 1, 5, 8),
('Frequent Visitor', 'زائر متكرر', 'Visit us 10 times', 'زرنا 10 مرات', 'home', 'bg-indigo-500', 'visits', 'visits_count', 10, 30, 9),
('Space Regular', 'مقيم دائم', 'Visit us 50 times', 'زرنا 50 مرة', 'building', 'bg-cyan-500', 'visits', 'visits_count', 50, 150, 10),

-- Spending milestones
('Big Spender', 'منفق كبير', 'Spend 1000 EGP total', 'أنفق 1000 جنيه إجمالاً', 'wallet', 'bg-emerald-500', 'spending', 'spending_total', 1000, 50, 11),
('VIP Spender', 'منفق VIP', 'Spend 5000 EGP total', 'أنفق 5000 جنيه إجمالاً', 'gem', 'bg-violet-500', 'spending', 'spending_total', 5000, 200, 12),

-- Event milestones
('Event Explorer', 'مستكشف الفعاليات', 'Attend your first event', 'احضر أول فعالية', 'calendar', 'bg-orange-500', 'events', 'events_attended', 1, 15, 13),
('Community Member', 'عضو المجتمع', 'Attend 5 events', 'احضر 5 فعاليات', 'users', 'bg-rose-500', 'events', 'events_attended', 5, 75, 14);
