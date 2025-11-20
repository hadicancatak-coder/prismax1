import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListTodo, AlertCircle, CheckSquare } from "lucide-react";
import { adminService } from "@/lib/adminService";
import { errorLogger } from "@/lib/errorLogger";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskAnalyticsDashboard } from "@/components/admin/TaskAnalyticsDashboard";

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    tasks: 0,
    unresolvedErrors: 0,
    pendingApprovals: 0,
  });
  const [errorStats, setErrorStats] = useState({
    critical: 0,
    warning: 0,
    info: 0,
    unresolved: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [systemHealth, errStats] = await Promise.all([
        adminService.getSystemHealth(),
        errorLogger.getErrorStats(),
      ]);

      if (systemHealth) {
        setStats(systemHealth);
      }
      if (errStats) {
        setErrorStats({
          critical: errStats.critical,
          warning: errStats.warning,
          info: errStats.info,
          unresolved: errStats.unresolved,
        });
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Task Analytics Dashboard - Primary Focus */}
      <div>
        <h2 className="text-heading-lg font-bold mb-sm">Task Analytics by User</h2>
        <p className="text-body-sm text-muted-foreground mb-md">
          Track individual team member performance and workload distribution
        </p>
        <TaskAnalyticsDashboard />
      </div>

      {/* System-wide Stats - Secondary */}
      <div>
        <h3 className="text-heading-md font-semibold mb-md">System Overview</h3>
        <div className="flex items-center gap-8 p-card bg-card rounded-lg border border-border">
          <div>
            <div className="text-metadata text-muted-foreground">Total Users</div>
            <div className="text-4xl font-semibold text-foreground mt-1">{stats.users}</div>
          </div>
          <div className="w-px h-12 bg-border" />
          <div>
            <div className="text-metadata text-muted-foreground">Total Tasks</div>
            <div className="text-4xl font-semibold text-foreground mt-1">{stats.tasks}</div>
          </div>
          <div className="w-px h-12 bg-border" />
          <div>
            <div className="text-metadata text-muted-foreground">Unresolved Errors</div>
            <div className="text-4xl font-semibold text-destructive mt-1">{stats.unresolvedErrors}</div>
          </div>
          <div className="w-px h-12 bg-border" />
          <div>
            <div className="text-metadata text-muted-foreground">Pending Approvals</div>
            <div className="text-4xl font-semibold text-foreground mt-1">{stats.pendingApprovals}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
