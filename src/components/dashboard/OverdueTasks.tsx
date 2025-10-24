import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function OverdueTasks() {
  const { user } = useAuth();
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchOverdueTasks();
    }
  }, [user?.id]);

  const fetchOverdueTasks = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        setOverdueTasks([]);
        setLoading(false);
        return;
      }

      const { data: assignedTasks } = await supabase
        .from("task_assignees")
        .select("task_id")
        .eq("user_id", profile.id);

      const taskIds = assignedTasks?.map(a => a.task_id) || [];

      if (taskIds.length === 0) {
        setOverdueTasks([]);
        setLoading(false);
        return;
      }

      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .in("id", taskIds)
        .lt("due_at", today.toISOString())
        .neq("status", "Completed")
        .order("due_at", { ascending: true })
        .limit(5);

      console.log('OverdueTasks data:', tasks);
      setOverdueTasks(tasks || []);
    } catch (err) {
      console.error('Error fetching overdue tasks:', err);
      setOverdueTasks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </Card>
    );
  }

  if (overdueTasks.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Overdue Tasks</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          No overdue tasks. Great work! 🎉
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-destructive/5 border-destructive/20">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">Overdue Tasks</h2>
        <Badge variant="destructive">{overdueTasks.length}</Badge>
      </div>
      
      <div className="space-y-2">
        {overdueTasks.map((task) => (
          <div key={task.id} className="flex items-start gap-2 p-3 bg-card rounded-lg border">
            <Clock className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">
                Due: {format(new Date(task.due_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
