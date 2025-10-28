import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Target, TrendingUp, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function MyKPIsProgress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<any[]>([]);
  const [quarterlyKpis, setQuarterlyKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchKPIs();
  }, [user?.id]);

  const fetchKPIs = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("kpis, quarterly_kpis")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      
      setKpis(Array.isArray(data?.kpis) ? data.kpis : []);
      setQuarterlyKpis(Array.isArray(data?.quarterly_kpis) ? data.quarterly_kpis : []);
    } catch (error) {
      console.error("Error fetching KPIs:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalWeight = kpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
  const quarterlyTotalWeight = quarterlyKpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            My KPIs Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (kpis.length === 0 && quarterlyKpis.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            My KPIs Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">No KPIs set yet</p>
          <Button onClick={() => navigate('/profile')} variant="outline">
            Set Your KPIs
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            My KPIs Progress
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Annual KPIs */}
        {kpis.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Annual KPIs
              </h4>
              <Badge variant="outline" className={totalWeight === 100 ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"}>
                {totalWeight}% / 100%
              </Badge>
            </div>
            <div className="space-y-3">
              {kpis.slice(0, 3).map((kpi, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="line-clamp-1">{kpi.description}</span>
                    <span className="text-muted-foreground ml-2">{kpi.weight}%</span>
                  </div>
                  <Progress value={kpi.weight} className="h-2" />
                  {kpi.timeline && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {kpi.timeline}
                    </p>
                  )}
                </div>
              ))}
              {kpis.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{kpis.length - 3} more KPIs
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quarterly KPIs */}
        {quarterlyKpis.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                Quarterly KPIs
              </h4>
              <Badge variant="outline" className={quarterlyTotalWeight === 100 ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"}>
                {quarterlyTotalWeight}% / 100%
              </Badge>
            </div>
            <div className="space-y-3">
              {quarterlyKpis.slice(0, 2).map((kpi, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="line-clamp-1">{kpi.description}</span>
                    <span className="text-muted-foreground ml-2">{kpi.weight}%</span>
                  </div>
                  <Progress value={kpi.weight} className="h-2" />
                  {kpi.timeline && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {kpi.timeline}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
