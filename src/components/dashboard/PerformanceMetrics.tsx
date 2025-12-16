import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, ListTodo, TrendingUp, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TaskStats {
  total: number;
  completed: number;
  completedThisWeek: number;
  completionRate: number;
}

interface CompletedTask {
  id: string;
  title: string;
  updated_at: string;
  completedBy?: string;
}

export function PerformanceMetrics() {
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    completedThisWeek: 0,
    completionRate: 0,
  });
  const [recentCompleted, setRecentCompleted] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const [totalRes, completedRes, weekRes, recentRes] = await Promise.all([
        supabase.from("tasks").select("id", { count: "exact", head: true }),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "Completed"),
        supabase.from("tasks").select("id", { count: "exact", head: true })
          .eq("status", "Completed")
          .gte("updated_at", startOfWeek.toISOString()),
        supabase.from("tasks")
          .select("id, title, updated_at, updated_by")
          .eq("status", "Completed")
          .order("updated_at", { ascending: false })
          .limit(5),
      ]);

      const total = totalRes.count || 0;
      const completed = completedRes.count || 0;
      const completedThisWeek = weekRes.count || 0;

      setStats({
        total,
        completed,
        completedThisWeek,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });

      if (recentRes.data) {
        const userIds = [...new Set(recentRes.data.map(t => t.updated_by).filter(Boolean))];
        let profiles: Record<string, string> = {};
        
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, name")
            .in("user_id", userIds);
          
          if (profilesData) {
            profiles = Object.fromEntries(profilesData.map(p => [p.user_id, p.name || "Unknown"]));
          }
        }

        setRecentCompleted(recentRes.data.map(t => ({
          id: t.id,
          title: t.title,
          updated_at: t.updated_at,
          completedBy: t.updated_by ? profiles[t.updated_by] : undefined,
        })));
      }

      setLoading(false);
    }

    fetchStats();
  }, []);

  const generateBrief = (title: string) => {
    if (title.length <= 50) return title;
    return title.substring(0, 50) + "...";
  };

  const statCards = [
    { label: "Total Tasks", value: stats.total, icon: ListTodo, color: "text-primary" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-success" },
    { label: "Completion Rate", value: `${stats.completionRate}%`, icon: TrendingUp, color: "text-warning" },
    { label: "This Week", value: stats.completedThisWeek, icon: Calendar, color: "text-primary" },
  ];

  if (loading) {
    return (
      <div className="space-y-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-card animate-pulse">
              <div className="h-16 bg-muted rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <div>
        <h2 className="text-heading-sm font-semibold text-foreground mb-md">Performance Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-card">
              <div className="flex items-center gap-sm">
                <div className={`p-sm rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-metadata text-muted-foreground">{stat.label}</p>
                  <p className="text-heading-md font-semibold text-foreground">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {recentCompleted.length > 0 && (
        <div>
          <h3 className="text-body font-medium text-foreground mb-sm">Recently Completed</h3>
          <Card className="divide-y divide-border">
            {recentCompleted.map((task) => (
              <div key={task.id} className="p-sm flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-foreground truncate">{generateBrief(task.title)}</p>
                  {task.completedBy && (
                    <p className="text-metadata text-muted-foreground">by {task.completedBy}</p>
                  )}
                </div>
                <span className="text-metadata text-muted-foreground ml-sm">
                  {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
