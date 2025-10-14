import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TasksTable } from "@/components/TasksTable";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { AssigneeFilterBar } from "@/components/AssigneeFilterBar";
import { DateFilter, TaskDateFilterBar } from "@/components/TaskDateFilterBar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { startOfToday, endOfToday, startOfTomorrow, endOfTomorrow, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth, addMonths, isWithinInterval } from "date-fns";

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const tasksWithComments = await Promise.all((data || []).map(async (task) => {
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', task.id);
        return { ...task, comments_count: count || 0 };
      }));
      
      setTasks(tasksWithComments);
    } catch (error: any) {
      toast({
        title: "Error fetching tasks",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const assigneeMatch = selectedAssignees.length === 0 || selectedAssignees.includes(task.assignee_id);
    const teamMatch = selectedTeams.length === 0;
    
    let dateMatch = true;
    if (dateFilter) {
      if (dateFilter.label === "Backlog") {
        dateMatch = !task.due_at;
      } else if (task.due_at) {
        const dueDate = new Date(task.due_at);
        dateMatch = isWithinInterval(dueDate, { 
          start: dateFilter.startDate, 
          end: dateFilter.endDate 
        });
      } else {
        dateMatch = false;
      }
    }
    
    const statusMatch = statusFilter === "all" || task.status === statusFilter;
    
    return assigneeMatch && teamMatch && dateMatch && statusMatch;
  });

  const taskCounts = {
    all: tasks.length,
    today: tasks.filter(t => t.due_at && isWithinInterval(new Date(t.due_at), { 
      start: startOfToday(), end: endOfToday() 
    })).length,
    tomorrow: tasks.filter(t => t.due_at && isWithinInterval(new Date(t.due_at), { 
      start: startOfTomorrow(), end: endOfTomorrow() 
    })).length,
    thisWeek: tasks.filter(t => t.due_at && isWithinInterval(new Date(t.due_at), {
      start: startOfWeek(new Date()), end: endOfWeek(new Date())
    })).length,
    nextWeek: tasks.filter(t => t.due_at && isWithinInterval(new Date(t.due_at), {
      start: startOfWeek(addWeeks(new Date(), 1)), 
      end: endOfWeek(addWeeks(new Date(), 1))
    })).length,
    thisMonth: tasks.filter(t => t.due_at && isWithinInterval(new Date(t.due_at), {
      start: startOfMonth(new Date()), end: endOfMonth(new Date())
    })).length,
    nextMonth: tasks.filter(t => t.due_at && isWithinInterval(new Date(t.due_at), {
      start: startOfMonth(addMonths(new Date(), 1)), 
      end: endOfMonth(addMonths(new Date(), 1))
    })).length,
    backlog: tasks.filter(t => !t.due_at).length
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Button onClick={() => setDialogOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <AssigneeFilterBar
        selectedAssignees={selectedAssignees}
        selectedTeams={selectedTeams}
        onAssigneesChange={setSelectedAssignees}
        onTeamsChange={setSelectedTeams}
      />
      
      <TaskDateFilterBar 
        onFilterChange={setDateFilter}
        onStatusChange={setStatusFilter}
        taskCounts={taskCounts}
      />

      {loading ? (
        <div className="text-center py-12">Loading tasks...</div>
      ) : (
        <TasksTable tasks={filteredTasks} onTaskUpdate={fetchTasks} />
      )}

      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
