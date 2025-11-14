import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CheckSquare, AlertCircle, Calendar, Activity, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MyTasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [taskCounts, setTaskCounts] = useState({
    today: 0,
    overdue: 0,
    thisWeek: 0,
    inProgress: 0,
  });

  useEffect(() => {
    if (!user?.id) return;
    fetchTaskCounts();
  }, [user?.id]);

  const fetchTaskCounts = async () => {
    if (!user?.id) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Get user's profile.id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;

    // Get task IDs assigned to this user
    const { data: assignedTasks } = await supabase
      .from("task_assignees")
      .select("task_id")
      .eq("user_id", profile.id);

    const taskIds = assignedTasks?.map((a) => a.task_id) || [];

    if (taskIds.length === 0) {
      setTaskCounts({ today: 0, overdue: 0, thisWeek: 0, inProgress: 0 });
      return;
    }

    // Today's tasks
    const { count: todayCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .in("id", taskIds)
      .gte("due_at", today.toISOString())
      .lt("due_at", tomorrow.toISOString())
      .neq("status", "Completed");

    // Overdue tasks
    const { count: overdueCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .in("id", taskIds)
      .lt("due_at", today.toISOString())
      .neq("status", "Completed");

    // This week's tasks
    const { count: weekCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .in("id", taskIds)
      .gte("due_at", today.toISOString())
      .lt("due_at", weekEnd.toISOString())
      .neq("status", "Completed");

    // In progress tasks
    const { count: inProgressCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .in("id", taskIds)
      .eq("status", "Ongoing");

    setTaskCounts({
      today: todayCount || 0,
      overdue: overdueCount || 0,
      thisWeek: weekCount || 0,
      inProgress: inProgressCount || 0,
    });
  };

  const taskCategories = [
    {
      label: "Today",
      count: taskCounts.today,
      icon: CheckSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Overdue",
      count: taskCounts.overdue,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "This Week",
      count: taskCounts.thisWeek,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "In Progress",
      count: taskCounts.inProgress,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <Card className="card-glow hover:shadow-[0_0_20px_rgba(0,82,204,0.3)] transition-all duration-300 p-6">
      <h2 className="text-section-title mb-6">My Tasks</h2>
      <div className="space-y-2">
        {taskCategories.map((category) => (
          <div
            key={category.label}
            onClick={() => navigate("/tasks")}
            className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-card-hover border border-border/50 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
                <category.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-foreground">{category.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-semibold">
                {category.count}
              </Badge>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
