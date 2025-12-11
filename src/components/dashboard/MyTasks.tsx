import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CheckSquare, AlertCircle, Calendar, Activity, ChevronRight } from "lucide-react";
import { DataCard } from "@/components/layout/DataCard";
import { Badge } from "@/components/ui/badge";
import { UnifiedTaskDialog } from "@/components/UnifiedTaskDialog";

export function MyTasks() {
  const { user } = useAuth();
  const [taskCounts, setTaskCounts] = useState({
    today: 0,
    overdue: 0,
    thisWeek: 0,
    inProgress: 0,
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

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

    // Overdue tasks (exclude Backlog)
    const { count: overdueCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .in("id", taskIds)
      .lt("due_at", today.toISOString())
      .neq("status", "Completed" as any)
      .neq("status", "Backlog" as any);

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

  const handleCategoryClick = async (category: string) => {
    if (!user?.id) return;

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
    if (taskIds.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    let query = supabase.from("tasks").select("id").in("id", taskIds);

    switch (category) {
      case "Today":
        query = query
          .gte("due_at", today.toISOString())
          .lt("due_at", tomorrow.toISOString())
          .neq("status", "Completed");
        break;
      case "Overdue":
        query = query
          .lt("due_at", today.toISOString())
          .neq("status", "Completed" as any)
          .neq("status", "Backlog" as any);
        break;
      case "This Week":
        query = query
          .gte("due_at", today.toISOString())
          .lt("due_at", weekEnd.toISOString())
          .neq("status", "Completed");
        break;
      case "In Progress":
        query = query.eq("status", "Ongoing");
        break;
    }

    const { data: tasks } = await query.limit(1);
    if (tasks && tasks.length > 0) {
      setSelectedTaskId(tasks[0].id);
      setTaskDialogOpen(true);
    }
  };

  const taskCategories = [
    {
      label: "Today",
      count: taskCounts.today,
      icon: CheckSquare,
    },
    {
      label: "Overdue",
      count: taskCounts.overdue,
      icon: AlertCircle,
    },
    {
      label: "This Week",
      count: taskCounts.thisWeek,
      icon: Calendar,
    },
    {
      label: "In Progress",
      count: taskCounts.inProgress,
      icon: Activity,
    },
  ];

  return (
    <>
      <DataCard className="hover:shadow-[0_0_20px_rgba(0,82,204,0.2)] transition-all duration-300">
        <h2 className="text-heading-sm font-semibold text-foreground mb-md">My Tasks</h2>
        <div className="space-y-sm">
          {taskCategories.map((category) => (
            <div
              key={category.label}
              onClick={() => handleCategoryClick(category.label)}
              className="flex items-center justify-between p-md rounded-lg bg-card hover:bg-card-hover border border-border/50 cursor-pointer transition-smooth hover:shadow-md hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">{category.label}</span>
              </div>
              <div className="flex items-center gap-sm">
                <Badge variant="secondary" className="font-semibold">
                  {category.count}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </DataCard>

      <UnifiedTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        taskId={selectedTaskId}
        mode="view"
      />
    </>
  );
}