import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Lock, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { getNeedsAttention } from "@/lib/dashboardQueries";
import { useAuth } from "@/hooks/useAuth";

export function NeedsAttention() {
  const { user } = useAuth();
  const [data, setData] = useState<any>({ overdueTasks: [], blockers: [], pendingApprovals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchNeedsAttention();
    }
  }, [user?.id]);

  const fetchNeedsAttention = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('NeedsAttention: Fetching data for user', user.id);
      const result = await getNeedsAttention(user.id);
      console.log('NeedsAttention: Received data', result);
      setData(result);
    } catch (err) {
      console.error('NeedsAttention: Error fetching data', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-40"></div>
          <div className="h-4 bg-muted rounded w-32"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive/20">
        <div className="text-destructive flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div>
            <p className="font-semibold">Error Loading Data</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  const totalItems = (data.overdueTasks?.length || 0) + (data.blockers?.length || 0) + (data.pendingApprovals?.length || 0);

  if (totalItems === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Needs Attention</h2>
        </div>
        <p className="text-sm text-muted-foreground">No items need attention right now. Great work!</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-destructive/5 border-destructive/20">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">Needs Attention</h2>
        <Badge variant="destructive">{totalItems}</Badge>
      </div>
      
      <div className="space-y-3">
        {data.overdueTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-foreground">Overdue Tasks</span>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {data.overdueTasks.length}
              </Badge>
            </div>
            {data.overdueTasks.slice(0, 3).map((task: any) => (
              <p key={task.id} className="text-sm text-muted-foreground ml-6 mb-1">
                • {task.title}
              </p>
            ))}
          </div>
        )}

        {data.blockers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-foreground">Active Blockers</span>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {data.blockers.length}
              </Badge>
            </div>
            {data.blockers.slice(0, 3).map((blocker: any) => (
              <p key={blocker.id} className="text-sm text-muted-foreground ml-6 mb-1">
                • {blocker.title}
              </p>
            ))}
          </div>
        )}

        {data.pendingApprovals.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-foreground">Pending Approvals</span>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                {data.pendingApprovals.length}
              </Badge>
            </div>
            {data.pendingApprovals.slice(0, 3).map((task: any) => (
              <p key={task.id} className="text-sm text-muted-foreground ml-6 mb-1">
                • {task.title}
              </p>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
