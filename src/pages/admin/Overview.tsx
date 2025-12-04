import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ListTodo, AlertCircle, CheckSquare } from "lucide-react";
import { adminService } from "@/lib/adminService";
import { errorLogger } from "@/lib/errorLogger";
import { Skeleton } from "@/components/ui/skeleton";

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    tasks: 0,
    unresolvedErrors: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const systemHealth = await adminService.getSystemHealth();

      if (systemHealth) {
        setStats(systemHealth);
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-md md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="surface-elevated">
            <CardContent className="p-lg">
              <Skeleton className="h-4 w-24 mb-md" />
              <Skeleton className="h-10 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {/* System Stats Cards */}
      <div className="grid gap-md md:grid-cols-2 lg:grid-cols-4">
        <Card className="surface-elevated hover-lift transition-smooth">
          <CardContent className="p-lg">
            <div className="flex items-center justify-between mb-sm">
              <span className="text-body-sm text-muted-foreground">Total Users</span>
              <div className="p-sm bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="text-page-title font-bold text-foreground">{stats.users}</div>
          </CardContent>
        </Card>

        <Card className="surface-elevated hover-lift transition-smooth">
          <CardContent className="p-lg">
            <div className="flex items-center justify-between mb-sm">
              <span className="text-body-sm text-muted-foreground">Total Tasks</span>
              <div className="p-sm bg-info/10 rounded-lg">
                <ListTodo className="h-5 w-5 text-info" />
              </div>
            </div>
            <div className="text-page-title font-bold text-foreground">{stats.tasks}</div>
          </CardContent>
        </Card>

        <Card className="surface-elevated hover-lift transition-smooth">
          <CardContent className="p-lg">
            <div className="flex items-center justify-between mb-sm">
              <span className="text-body-sm text-muted-foreground">Unresolved Errors</span>
              <div className="p-sm bg-destructive/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <div className="text-page-title font-bold text-destructive">{stats.unresolvedErrors}</div>
          </CardContent>
        </Card>

        <Card className="surface-elevated hover-lift transition-smooth">
          <CardContent className="p-lg">
            <div className="flex items-center justify-between mb-sm">
              <span className="text-body-sm text-muted-foreground">Pending Approvals</span>
              <div className="p-sm bg-warning/10 rounded-lg">
                <CheckSquare className="h-5 w-5 text-warning" />
              </div>
            </div>
            <div className="text-page-title font-bold text-foreground">{stats.pendingApprovals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="surface-elevated">
        <CardContent className="p-lg">
          <h3 className="text-heading-sm font-semibold mb-md">Quick Actions</h3>
          <div className="grid gap-sm md:grid-cols-3">
            <a 
              href="/admin/users" 
              className="flex items-center gap-sm p-md rounded-lg bg-card hover:bg-card-hover border border-border transition-smooth"
            >
              <Users className="h-5 w-5 text-primary" />
              <span className="text-body-sm font-medium">Manage Users</span>
            </a>
            <a 
              href="/admin/kpis" 
              className="flex items-center gap-sm p-md rounded-lg bg-card hover:bg-card-hover border border-border transition-smooth"
            >
              <ListTodo className="h-5 w-5 text-primary" />
              <span className="text-body-sm font-medium">Manage KPIs</span>
            </a>
            <a 
              href="/admin/logs" 
              className="flex items-center gap-sm p-md rounded-lg bg-card hover:bg-card-hover border border-border transition-smooth"
            >
              <AlertCircle className="h-5 w-5 text-primary" />
              <span className="text-body-sm font-medium">View Logs</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
