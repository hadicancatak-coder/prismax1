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
      <div className="flex items-center gap-8 py-6 border-b border-border">
        <div>
          <div className="text-metadata">Total Users</div>
          <div className="text-4xl font-semibold text-foreground mt-1">{stats.users}</div>
        </div>
        <div className="w-px h-12 bg-border" />
        <div>
          <div className="text-metadata">Total Tasks</div>
          <div className="text-4xl font-semibold text-foreground mt-1">{stats.tasks}</div>
        </div>
        <div className="w-px h-12 bg-border" />
        <div>
          <div className="text-metadata">Unresolved Errors</div>
          <div className="text-4xl font-semibold text-destructive mt-1">{stats.unresolvedErrors}</div>
        </div>
        <div className="w-px h-12 bg-border" />
        <div>
          <div className="text-metadata">Pending Approvals</div>
          <div className="text-4xl font-semibold text-foreground mt-1">{stats.pendingApprovals}</div>
        </div>
      </div>

      {/* Task Analytics Dashboard */}
      <div>
        <h3 className="text-section-title mb-6">Task Analytics</h3>
        <TaskAnalyticsDashboard />
      </div>
    </div>
  );
}
