import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analyticsData, dateRange } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get user ID from auth header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token || '');
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Construct AI prompt
    const systemPrompt = `You are a business intelligence analyst for a coworking space. Analyze the customer data and provide actionable insights.
    
Return your analysis in JSON format with these categories:
- key_trends: Array of 3-5 important trends you notice
- warnings: Array of 2-3 potential issues or concerns
- opportunities: Array of 2-3 growth opportunities
- recommendations: Array of 3-5 specific actionable recommendations

Be specific, data-driven, and focus on actionable insights.`;

    const userPrompt = `Analyze this coworking space customer data:

Total Customers: ${analyticsData.totalCustomers}
Active Customers: ${analyticsData.activeCustomers}
Total Revenue: ${analyticsData.totalRevenue} EGP
Average Order Value: ${analyticsData.avgOrderValue} EGP
Total Orders: ${analyticsData.totalOrders}
Date Range: ${dateRange.from} to ${dateRange.to}

Top 5 Customers by Spending: ${JSON.stringify(analyticsData.topCustomers || [])}
Visit Patterns: ${JSON.stringify(analyticsData.visitPatterns || {})}
Demographics: ${JSON.stringify(analyticsData.demographics || {})}

Provide insights and recommendations.`;

    console.log('Calling Lovable AI for customer insights...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a few moments.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted. Please add credits to your workspace.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insightsText = aiData.choices[0].message.content;
    const insights = JSON.parse(insightsText);

    // Store insights in database
    const { data: savedInsight, error: dbError } = await supabase
      .from('ai_insights')
      .insert({
        insight_type: 'customer_analytics',
        insights: insights,
        generated_by: user.id,
        date_range_from: dateRange.from,
        date_range_to: dateRange.to,
        metadata: { totalCustomers: analyticsData.totalCustomers }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
    }

    console.log('AI insights generated successfully');

    return new Response(JSON.stringify({ 
      success: true,
      insights,
      saved_id: savedInsight?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-customer-insights:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
