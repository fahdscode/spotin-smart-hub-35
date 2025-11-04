-- Create table to store AI-generated insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,
  insights JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID,
  date_range_from DATE,
  date_range_to DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can view ai_insights"
  ON public.ai_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Admin users can insert ai_insights"
  ON public.ai_insights FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Create index for faster queries
CREATE INDEX idx_ai_insights_generated_at ON public.ai_insights(generated_at DESC);
CREATE INDEX idx_ai_insights_type ON public.ai_insights(insight_type);