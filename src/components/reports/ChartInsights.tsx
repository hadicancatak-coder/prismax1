import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ChartInsightsProps {
  chartData: any[];
  chartType: string;
  title?: string;
}

export function ChartInsights({ chartData, chartType, title }: ChartInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateInsights = async () => {
    if (!chartData || chartData.length === 0) {
      toast({
        title: "No Data",
        description: "Chart must have data to generate insights.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: { chartData, chartType, title },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setInsights(data.insights);
      toast({
        title: "Insights Generated",
        description: "AI analysis complete.",
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate insights.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {!insights ? (
        <Button
          onClick={generateInsights}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate AI Insights
            </>
          )}
        </Button>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{insights}</p>
            <Button
              onClick={generateInsights}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className="mt-2"
            >
              Regenerate
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
