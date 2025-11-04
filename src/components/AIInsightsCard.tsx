import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIInsights {
  key_trends: string[];
  warnings: string[];
  opportunities: string[];
  recommendations: string[];
}

interface AIInsightsCardProps {
  analyticsData: {
    totalCustomers: number;
    activeCustomers: number;
    totalRevenue: number;
    avgOrderValue: number;
    totalOrders: number;
    topCustomers?: any[];
    visitPatterns?: any;
    demographics?: any;
  };
  dateRange: {
    from: string;
    to: string;
  };
}

export const AIInsightsCard = ({ analyticsData, dateRange }: AIInsightsCardProps) => {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-customer-insights', {
        body: {
          analyticsData,
          dateRange
        }
      });

      if (error) {
        console.error('Error generating insights:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to generate insights. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      setInsights(data.insights);
      toast({
        title: "Success",
        description: "AI insights generated successfully!",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Customer Insights</h3>
        </div>
        <Button 
          onClick={generateInsights} 
          disabled={isLoading}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Insights
            </>
          )}
        </Button>
      </div>

      {insights ? (
        <div className="space-y-6">
          {/* Key Trends */}
          {insights.key_trends?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <h4 className="font-medium text-sm">Key Trends</h4>
              </div>
              <ul className="space-y-2">
                {insights.key_trends.map((trend, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground pl-6 relative before:content-['•'] before:absolute before:left-2">
                    {trend}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {insights.warnings?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <h4 className="font-medium text-sm">Warnings</h4>
              </div>
              <ul className="space-y-2">
                {insights.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground pl-6 relative before:content-['⚠️'] before:absolute before:left-2">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Opportunities */}
          {insights.opportunities?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <h4 className="font-medium text-sm">Opportunities</h4>
              </div>
              <ul className="space-y-2">
                {insights.opportunities.map((opportunity, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground pl-6 relative before:content-['💡'] before:absolute before:left-2">
                    {opportunity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-green-500" />
                <h4 className="font-medium text-sm">Recommendations</h4>
              </div>
              <ul className="space-y-2">
                {insights.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground pl-6 relative before:content-['🎯'] before:absolute before:left-2">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Click "Generate Insights" to get AI-powered analysis of your customer data</p>
        </div>
      )}
    </Card>
  );
};
