import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskListDialog } from "@/components/TaskListDialog";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { WhatsNext } from "@/components/dashboard/WhatsNext";
import { NeedsAttention } from "@/components/dashboard/NeedsAttention";
import { getDashboardStats } from "@/lib/dashboardQueries";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    today: 0,
    overdue: 0,
    inProgress: 0,
    completedThisWeek: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [statDialogOpen, setStatDialogOpen] = useState(false);
  const [statTasks, setStatTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboardData = async () => {
      const statsData = await getDashboardStats(user.id);
      setStats(statsData);
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

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your team's progress</p>
      </div>

      <StatsCards stats={stats} onStatClick={handleStatClick} />

      <NeedsAttention />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WhatsNext />
        <ActivityFeed />
      </div>

      {selectedTaskId && (
        <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} taskId={selectedTaskId} />
      )}

      <TaskListDialog
        open={statDialogOpen}
        onOpenChange={setStatDialogOpen}
        tasks={statTasks}
        title="Tasks"
      />
    </div>
  );
}
