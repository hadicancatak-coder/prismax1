import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TaskDialog } from "@/components/TaskDialog";
import { Calendar, AlertCircle, Clock, User } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Backlog() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [backlogTasks, setBacklogTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  useEffect(() => {
    // Wait for userRole to load before checking
    if (userRole === null) return;
    
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

    // Sort by priority (recurring tasks will be High), then by created_at
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .is("delete_requested_by", null)
      .is("due_at", null)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Fetch assignee and creator profiles for each task
      const tasksWithProfiles = await Promise.all(
        (data || []).map(async (task) => {
          let assignee = null;
          let creator = null;

          if (task.assignee_id) {
            const { data: assigneeData } = await supabase
              .from("profiles")
              .select("name")
              .eq("user_id", task.assignee_id)
              .maybeSingle();
            assignee = assigneeData;
          }

          if (task.created_by) {
            const { data: creatorData } = await supabase
              .from("profiles")
              .select("name")
              .eq("user_id", task.created_by)
              .maybeSingle();
            creator = creatorData;
          }

          return { ...task, assignee, creator };
        })
      );
      setBacklogTasks(tasksWithProfiles);
    }

    setLoading(false);
  };

  const handleScheduleTask = async (taskId: string, date: Date) => {
    const { error } = await supabase
      .from("tasks")
      .update({ due_at: format(date, 'yyyy-MM-dd') })
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
      description: `Task scheduled for ${format(date, 'MMM dd, yyyy')}`,
    });

    await fetchBacklogTasks();
    setSchedulingTaskId(null);
    setSelectedDate(undefined);
  };

  if (loading || userRole === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading Backlog...</div>
      </div>
    );
  }

  if (userRole !== "admin") {
    return null;
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <PageHeader
        title="Backlog"
        description="Unscheduled tasks waiting to be planned"
      />

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
                      <Popover open={schedulingTaskId === task.id} onOpenChange={(open) => !open && setSchedulingTaskId(null)}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSchedulingTaskId(task.id);
                            }}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Schedule
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              if (date) {
                                setSelectedDate(date);
                                handleScheduleTask(task.id, date);
                              }
                            }}
                            className={cn("p-3 pointer-events-auto")}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
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
