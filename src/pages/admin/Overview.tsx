import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListTodo, AlertCircle, CheckSquare } from "lucide-react";
import { adminService } from "@/lib/adminService";
import { errorLogger } from "@/lib/errorLogger";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamKPIsManager } from "@/components/admin/TeamKPIsManager";

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 transition-shadow duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <h3 className="text-3xl font-bold mt-2">{stats.users}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 transition-shadow duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
              <h3 className="text-3xl font-bold mt-2">{stats.tasks}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <ListTodo className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 transition-shadow duration-200 hover:shadow-lg border-l-4 border-l-destructive">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unresolved Errors</p>
              <h3 className="text-3xl font-bold mt-2 text-destructive">{stats.unresolvedErrors}</h3>
            </div>
            <div className="p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </Card>

        <Card className="p-6 transition-shadow duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
              <h3 className="text-3xl font-bold mt-2">{stats.pendingApprovals}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <CheckSquare className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          System Health
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg transition-colors hover:bg-green-100">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium">Database</span>
            </div>
            <span className="text-sm text-green-700 font-medium">Operational</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg transition-colors hover:bg-green-100">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium">Authentication</span>
            </div>
            <span className="text-sm text-green-700 font-medium">Operational</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg transition-colors hover:bg-green-100">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium">API</span>
            </div>
            <span className="text-sm text-green-700 font-medium">Operational</span>
          </div>
        </div>
      </Card>

      {/* Team KPIs Section */}
      <TeamKPIsManager />
    </div>
  );
}
