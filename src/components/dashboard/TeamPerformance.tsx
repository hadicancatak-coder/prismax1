import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface UserPerformance {
  userId: string;
  name: string;
  avatar?: string;
  totalTasks: number;
  completedTasks: number;
  score: number;
}

export function TeamPerformance() {
  const [users, setUsers] = useState<UserPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamPerformance() {
      // Get all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, name, avatar_url");

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Get ALL task assignees (no date filter)
      const { data: allAssignees } = await supabase
        .from("task_assignees")
        .select("user_id, task_id");

      // Get ALL completed task assignees
      const { data: completedAssignees } = await supabase
        .from("task_assignees")
        .select("user_id, task_id, tasks!inner(id, status)")
        .eq("tasks.status", "Completed");

      const userStats: Record<string, { total: number; completed: number }> = {};

      // Initialize all users with 0 stats
      profiles.forEach((p) => {
        userStats[p.id] = { total: 0, completed: 0 };
      });

      // Count total tasks per user (using profile.id which matches task_assignees.user_id)
      allAssignees?.forEach((a) => {
        if (userStats[a.user_id]) {
          userStats[a.user_id].total++;
        }
      });

      // Count completed tasks per user
      completedAssignees?.forEach((a) => {
        if (userStats[a.user_id]) {
          userStats[a.user_id].completed++;
        }
      });

      // Build user performance list - show ALL users
      const performance: UserPerformance[] = profiles
        .map((p) => {
          const stats = userStats[p.id] || { total: 0, completed: 0 };
          const score = stats.total > 0
            ? Math.min(10, Math.round((stats.completed / stats.total) * 10 * 10) / 10)
            : 0;

          return {
            userId: p.user_id,
            name: p.name || "Unknown",
            avatar: p.avatar_url || undefined,
            totalTasks: stats.total,
            completedTasks: stats.completed,
            score,
          };
        })
        .sort((a, b) => b.score - a.score || b.totalTasks - a.totalTasks);

      setUsers(performance);
      setLoading(false);
    }

    fetchTeamPerformance();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 7) return "bg-success/15 text-success";
    if (score >= 4) return "bg-warning/15 text-warning";
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

  return (
    <Card className="p-card">
      <h2 className="text-heading-sm font-semibold text-foreground mb-md flex items-center gap-sm">
        <Users className="h-5 w-5 text-muted-foreground" />
        Team Performance
      </h2>
      
      {/* Header Row */}
      <div className="flex items-center gap-md px-sm py-xs text-metadata text-muted-foreground border-b border-border mb-sm">
        <div className="w-9" /> {/* Avatar space */}
        <div className="flex-1">Name</div>
        <div className="w-16 text-center">Total</div>
        <div className="w-16 text-center">Done</div>
        <div className="w-20 text-center">Score</div>
      </div>
      
      <div className="space-y-xs max-h-[400px] overflow-y-auto hide-scrollbar">
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
            </div>
            <div className="w-16 text-center text-body-sm text-muted-foreground">
              {user.totalTasks}
            </div>
            <div className="w-16 text-center text-body-sm text-foreground font-medium">
              {user.completedTasks}
            </div>
            <div
              className={`w-20 px-sm py-xs rounded-full text-metadata font-semibold text-center ${getScoreColor(user.score)}`}
            >
              {user.score}/10
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
