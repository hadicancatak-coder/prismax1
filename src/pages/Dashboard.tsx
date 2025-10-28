import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskListDialog } from "@/components/TaskListDialog";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { WhatsNext } from "@/components/dashboard/WhatsNext";
import { OverdueTasks } from "@/components/dashboard/OverdueTasks";
import { UpcomingCampaigns } from "@/components/dashboard/UpcomingCampaigns";
import { MyKPIsProgress } from "@/components/dashboard/MyKPIsProgress";
import { getDashboardStats } from "@/lib/dashboardQueries";
import { NewsTicker } from "@/components/NewsTicker";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      try {
        const statsData = await getDashboardStats(user.id);
        setStats(statsData);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const handleStatClick = async (type: 'today' | 'overdue' | 'inProgress') => {
    if (!user?.id) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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

    const taskIds = assignedTasks?.map(a => a.task_id) || [];

    if (taskIds.length === 0) {
      setStatTasks([]);
      setStatDialogOpen(true);
      return;
    }

    let query = supabase.from("tasks").select("*").in("id", taskIds);

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
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your overview</p>
      </header>

      <NewsTicker />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <StatsCards stats={stats} onStatClick={handleStatClick} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <MyKPIsProgress />
        </div>
        
        <div className="lg:col-span-1">
          <UpcomingCampaigns />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <OverdueTasks />
        </div>
        
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      <WhatsNext />

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
