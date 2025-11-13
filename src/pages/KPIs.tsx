import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useKPIs } from "@/hooks/useKPIs";
import { useAuth } from "@/hooks/useAuth";
import { Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function KPIs() {
  const { user } = useAuth();
  const { kpis, isLoading } = useKPIs();

  // Filter KPIs assigned to the current user
  const myKPIs = kpis?.filter(kpi => 
    kpi.assignments?.some(assignment => assignment.user_id === user?.id)
  ) || [];

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-8 bg-background min-h-screen space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-8 bg-background min-h-screen space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-page-title">My KPIs</h1>
          <p className="text-muted-foreground mt-1">Track your key performance indicators and goals</p>
        </div>
      </div>

      {myKPIs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No KPIs Assigned</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have any KPIs assigned yet. Your manager will assign KPIs that you'll be able to track here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myKPIs.map((kpi) => {
            const myAssignment = kpi.assignments?.find(a => a.user_id === user?.id);
            const totalTarget = kpi.targets?.reduce((sum, t) => sum + t.target_value, 0) || 0;
            const totalCurrent = kpi.targets?.reduce((sum, t) => sum + t.current_value, 0) || 0;
            const progress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

            return (
              <Card key={kpi.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{kpi.name}</CardTitle>
                      {kpi.description && (
                        <CardDescription className="mt-1">{kpi.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant={myAssignment?.status === 'approved' ? 'default' : 'secondary'}>
                      {myAssignment?.status || 'pending'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{kpi.type}</Badge>
                    <Badge variant="outline">{kpi.period}</Badge>
                    <Badge variant="outline">Weight: {kpi.weight}%</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {kpi.targets && kpi.targets.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Targets
                      </h4>
                      {kpi.targets.map((target) => (
                        <div key={target.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                          <span className="text-muted-foreground">{target.target_name}</span>
                          <span className="font-medium">
                            {target.current_value} / {target.target_value} {target.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {myAssignment?.notes && (
                    <div className="text-sm p-2 bg-accent/10 rounded border border-accent/20">
                      <p className="text-muted-foreground">{myAssignment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
