import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TaskDialog } from "@/components/TaskDialog";
import { Calendar, AlertCircle, Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Backlog() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [backlogTasks, setBacklogTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== "admin") {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access the backlog",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    fetchBacklogTasks();

    // Real-time subscription
    const channel = supabase
      .channel("backlog-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        fetchBacklogTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole, navigate]);

  const fetchBacklogTasks = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        delete_requester:delete_requested_by(name),
        assignee:assignee_id(name),
        creator:created_by(name)
      `)
      .is("delete_requested_by", null)
      .is("due_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setBacklogTasks(data || []);
    }

    setLoading(false);
  };

  const handleScheduleTask = async (taskId: string, date: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ due_at: date })
      .eq("id", taskId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Task Scheduled",
      description: "Task has been moved to the calendar",
    });

    await fetchBacklogTasks();
  };

  if (loading || userRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading Backlog...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="bg-gradient-primary p-4 rounded-lg mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">📋 Backlog</h1>
        <p className="text-white/90">Unscheduled tasks waiting to be planned</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-2/5">Task</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Assignee</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Created</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {backlogTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No tasks in backlog
                  </td>
                </tr>
              ) : (
                backlogTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setTaskDialogOpen(true);
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={
                          task.status === "In Progress"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : task.status === "Pending Approval"
                            ? "bg-pending/10 text-pending border-pending/20"
                            : task.status === "Completed"
                            ? "bg-success/10 text-success border-success/20"
                            : task.status === "Blocked"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {task.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        {task.assignee?.name || "Unassigned"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(task.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const date = prompt("Enter date (YYYY-MM-DD):");
                          if (date) {
                            handleScheduleTask(task.id, date);
                          }
                        }}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedTaskId && (
        <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} taskId={selectedTaskId} />
      )}
    </div>
  );
}
