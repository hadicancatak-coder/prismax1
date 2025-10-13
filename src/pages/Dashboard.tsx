import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskListDialog } from "@/components/TaskListDialog";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    today: 0,
    overdue: 0,
    inProgress: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [statDialogOpen, setStatDialogOpen] = useState(false);
  const [statTasks, setStatTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboardData = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [todayRes, overdueRes, inProgressRes, recentRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .gte("due_at", today.toISOString())
          .lt("due_at", tomorrow.toISOString())
          .neq("status", "Completed"),
        
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .lt("due_at", today.toISOString())
          .neq("status", "Completed"),
        
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("status", "Ongoing"),
        
        supabase
          .from("tasks")
          .select(`
            id,
            title,
            status,
            priority,
            due_at,
            created_at,
            profiles:created_by(name),
            assignee:assignee_id(name)
          `)
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      setStats({
        today: todayRes.count || 0,
        overdue: overdueRes.count || 0,
        inProgress: inProgressRes.count || 0,
      });

      setRecentTasks(recentRes.data || []);
    };

    fetchDashboardData();
  }, [user?.id]);

  const handleStatClick = async (type: 'today' | 'overdue' | 'inProgress') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let query = supabase.from("tasks").select("*");

    if (type === 'today') {
      query = query.gte("due_at", today.toISOString()).lt("due_at", tomorrow.toISOString()).neq("status", "Completed");
    } else if (type === 'overdue') {
      query = query.lt("due_at", today.toISOString()).neq("status", "Completed");
    } else if (type === 'inProgress') {
      query = query.eq("status", "Ongoing");
    }

    const { data } = await query.order("created_at", { ascending: false });
    setStatTasks(data || []);
    setStatDialogOpen(true);
  };

  const statsDisplay = [
    { title: "Due Today", value: stats.today.toString(), icon: Clock, color: "text-warning", bgColor: "bg-warning/10", type: 'today' as const },
    { title: "In Progress", value: stats.inProgress.toString(), icon: TrendingUp, color: "text-primary", bgColor: "bg-primary/10", type: 'inProgress' as const },
    { title: "Overdue", value: stats.overdue.toString(), icon: AlertCircle, color: "text-destructive", bgColor: "bg-destructive/10", type: 'overdue' as const },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your team's progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsDisplay.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="p-6 transition-all hover:shadow-medium hover:-translate-y-1 animate-scale-in cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => handleStatClick(stat.type)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Tasks</h2>
        <div className="space-y-3">
          {recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedTaskId(task.id);
                  setTaskDialogOpen(true);
                }}
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">{task.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Assigned to {task.assignee?.name || "Unassigned"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={
                      task.status === "Ongoing"
                        ? "bg-warning/10 text-warning border-warning/20"
                        : task.status === "Pending"
                        ? "bg-pending/10 text-pending border-pending/20"
                        : task.status === "Completed"
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-muted text-muted-foreground border-border"
                    }
                  >
                    {task.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      task.priority === "High"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : task.priority === "Medium"
                        ? "bg-warning/10 text-warning border-warning/20"
                        : "bg-muted text-muted-foreground border-border"
                    }
                  >
                    {task.priority}
                  </Badge>
                  <span className="text-sm text-muted-foreground min-w-[80px] text-right">
                    {task.due_at ? new Date(task.due_at).toLocaleDateString() : "No due date"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tasks yet. Create your first task!
            </div>
          )}
        </div>
      </Card>

      {selectedTaskId && (
        <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} taskId={selectedTaskId} />
      )}

      <TaskListDialog
        open={statDialogOpen}
        onOpenChange={setStatDialogOpen}
        tasks={statTasks}
        title={statsDisplay.find(s => s.value === statTasks.length.toString())?.title || "Tasks"}
      />
    </div>
  );
}
