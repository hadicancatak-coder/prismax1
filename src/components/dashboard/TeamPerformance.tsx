import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface UserPerformance {
  userId: string;
  name: string;
  avatar?: string;
  tasksThisWeek: number;
  completedThisWeek: number;
  score: number;
}

export function TeamPerformance() {
  const [users, setUsers] = useState<UserPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamPerformance() {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Get all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url");

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Get task assignees for this week
      const { data: assignees } = await supabase
        .from("task_assignees")
        .select("user_id, task_id, tasks!inner(id, status, created_at, updated_at)")
        .gte("tasks.created_at", startOfWeek.toISOString());

      // Get completed tasks by user this week
      const { data: completedAssignees } = await supabase
        .from("task_assignees")
        .select("user_id, task_id, tasks!inner(id, status, updated_at)")
        .eq("tasks.status", "Completed")
        .gte("tasks.updated_at", startOfWeek.toISOString());

      const userStats: Record<string, { assigned: number; completed: number }> = {};

      // Count assigned tasks per user this week
      assignees?.forEach((a) => {
        if (!userStats[a.user_id]) {
          userStats[a.user_id] = { assigned: 0, completed: 0 };
        }
        userStats[a.user_id].assigned++;
      });

      // Count completed tasks per user this week
      completedAssignees?.forEach((a) => {
        if (!userStats[a.user_id]) {
          userStats[a.user_id] = { assigned: 0, completed: 0 };
        }
        userStats[a.user_id].completed++;
      });

      // Build user performance list
      const performance: UserPerformance[] = profiles
        .filter((p) => userStats[p.user_id]) // Only users with tasks
        .map((p) => {
          const stats = userStats[p.user_id] || { assigned: 0, completed: 0 };
          const score = stats.assigned > 0
            ? Math.min(10, Math.round((stats.completed / stats.assigned) * 10))
            : 5; // Neutral score if no tasks

          return {
            userId: p.user_id,
            name: p.name || "Unknown",
            avatar: p.avatar_url || undefined,
            tasksThisWeek: stats.assigned,
            completedThisWeek: stats.completed,
            score,
          };
        })
        .sort((a, b) => b.score - a.score);

      setUsers(performance);
      setLoading(false);
    }

    fetchTeamPerformance();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-success/15 text-success";
    if (score >= 5) return "bg-warning/15 text-warning";
    return "bg-destructive/15 text-destructive";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card className="p-card">
        <div className="animate-pulse space-y-md">
          <div className="h-6 bg-muted rounded w-40" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-sm">
              <div className="h-10 w-10 bg-muted rounded-full" />
              <div className="flex-1 h-4 bg-muted rounded" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="p-card">
        <div className="flex items-center gap-sm text-muted-foreground">
          <Users className="h-5 w-5" />
          <span className="text-body-sm">No team activity this week</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-card">
      <h2 className="text-heading-sm font-semibold text-foreground mb-md flex items-center gap-sm">
        <Users className="h-5 w-5 text-muted-foreground" />
        Team Performance This Week
      </h2>
      <div className="space-y-sm">
        {users.map((user) => (
          <div
            key={user.userId}
            className="flex items-center gap-md p-sm rounded-lg hover:bg-muted/50 transition-smooth"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-metadata">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-metadata text-muted-foreground">
                {user.completedThisWeek}/{user.tasksThisWeek} tasks completed
              </p>
            </div>
            <div
              className={`px-sm py-xs rounded-full text-metadata font-semibold ${getScoreColor(user.score)}`}
            >
              {user.score}/10
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
