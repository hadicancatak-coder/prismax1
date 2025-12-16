import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, ListTodo, TrendingUp, Calendar } from "lucide-react";

interface TaskStats {
  total: number;
  completed: number;
  completedThisWeek: number;
  completionRate: number;
}

export function PerformanceMetrics() {
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    completedThisWeek: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const [totalRes, completedRes, weekRes] = await Promise.all([
        supabase.from("tasks").select("id", { count: "exact", head: true }),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "Completed"),
        supabase.from("tasks").select("id", { count: "exact", head: true })
          .eq("status", "Completed")
          .gte("updated_at", startOfWeek.toISOString()),
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

      setLoading(false);
    }

    fetchStats();
  }, []);

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
    </div>
  );
}
