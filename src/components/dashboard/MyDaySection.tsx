import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  due_at: string | null;
  status: string;
  assignees?: Array<{ name: string }>;
}

interface MyDaySectionProps {
  userId: string;
  onTaskClick?: (taskId: string) => void;
}

export function MyDaySection({ userId, onTaskClick }: MyDaySectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchMyDayTasks();

    const channel = supabase
      .channel('my_day_tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchMyDayTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchMyDayTasks = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!profile) return;

    const { data: assignedTasks } = await supabase
      .from("task_assignees")
      .select("task_id")
      .eq("user_id", profile.id);

    const taskIds = assignedTasks?.map(a => a.task_id) || [];
    if (taskIds.length === 0) {
      setTasks([]);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        due_at,
        status
      `)
      .in("id", taskIds)
      .neq("status", "Completed")
      .or(`due_at.lt.${today.toISOString()},and(due_at.gte.${today.toISOString()},due_at.lt.${tomorrow.toISOString()})`)
      .order("due_at", { ascending: true })
      .limit(10);

    setTasks(data || []);
  };

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const newStatus = task?.status === "Completed" ? "Pending" : "Completed";
    
    await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId);

    toast.success(newStatus === "Completed" ? "Task completed" : "Task reopened");
    fetchMyDayTasks();
  };

  const formatDueDate = (dueAt: string | null) => {
    if (!dueAt) return "No due date";
    const date = new Date(dueAt);
    const now = new Date();
    
    if (date < now) {
      return `Overdue ${formatDistanceToNow(date, { addSuffix: true })}`;
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const isOverdue = (dueAt: string | null) => {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  };

  return (
    <div className="space-y-0">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">My Day</h2>
      
      {tasks.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          All clear for today! 🎉
        </div>
      ) : (
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 py-3 hover:bg-gray-50 transition-colors group">
              <Checkbox 
                checked={task.status === "Completed"}
                onCheckedChange={() => handleToggleComplete(task.id)}
                className="shrink-0"
              />
              
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onTaskClick?.(task.id)}
              >
                <p className="font-medium text-gray-900 truncate">{task.title}</p>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className={isOverdue(task.due_at) ? "text-red-600" : "text-gray-500"}>
                    📅 {formatDueDate(task.due_at)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleComplete(task.id);
                  }}
                  className="h-8 w-8"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick?.(task.id);
                  }}
                  className="h-8 w-8"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
