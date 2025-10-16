import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TasksTable } from "@/components/TasksTable";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { AssigneeFilterBar } from "@/components/AssigneeFilterBar";
import { DateFilter, TaskDateFilterBar } from "@/components/TaskDateFilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskTemplateDialog } from "@/components/TaskTemplateDialog";
import { Plus, FileText, Search } from "lucide-react";
import { startOfToday, endOfToday, startOfTomorrow, endOfTomorrow, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth, addMonths, isWithinInterval } from "date-fns";

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    
    const tasksChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    const assigneesChannel = supabase
      .channel('task-assignees-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, () => {
        console.log('Assignment changed, refetching tasks...');
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(assigneesChannel);
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch assignees for each task from task_assignees table
      const tasksWithAssignees = await Promise.all((data || []).map(async (task) => {
        const { data: assigneeData } = await supabase
          .from('task_assignees')
          .select(`
            profiles:user_id(id, user_id, name, avatar_url, teams)
          `)
          .eq('task_id', task.id);
        
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', task.id);
        
        return { 
          ...task, 
          assignees: assigneeData?.map(a => a.profiles).filter(Boolean) || [],
          comments_count: count || 0 
        };
      }));
      
      console.log('Fetched tasks:', tasksWithAssignees);
      console.log('Task count:', tasksWithAssignees.length);
      setTasks(tasksWithAssignees);
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
    // Check if any of the task's assignees match the selected assignees
    const assigneeMatch = selectedAssignees.length === 0 || 
      task.assignees?.some((assignee: any) => selectedAssignees.includes(assignee.user_id));
    
    const teamMatch = selectedTeams.length === 0 || 
      task.assignees?.some((assignee: any) => 
        assignee.teams?.some((team: string) => selectedTeams.includes(team))
      );
    
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
    
    // Full-text search
    const searchMatch = searchQuery === "" || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.entity && (
        Array.isArray(task.entity) 
          ? task.entity.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
          : task.entity.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    return assigneeMatch && teamMatch && dateMatch && statusMatch && searchMatch;
  });

  const handleCreateFromTemplate = (template: any) => {
    // Pre-fill the create dialog with template data
    setDialogOpen(true);
    toast({
      title: "Template loaded",
      description: `Creating task from "${template.name}" template`,
    });
  };

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
        <div className="flex gap-2">
          <Button onClick={() => setTemplateDialogOpen(true)} variant="outline" size="lg">
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Button onClick={() => setDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks by title, description, or entity..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">No tasks found</p>
          <p className="text-sm text-muted-foreground">Click "New Task" to create your first task</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">No tasks match your filters</p>
          <Button variant="outline" onClick={() => {
            setSelectedAssignees([]);
            setSelectedTeams([]);
            setDateFilter(null);
            setStatusFilter("all");
          }}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <TasksTable tasks={filteredTasks} onTaskUpdate={fetchTasks} />
      )}

      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <TaskTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        onCreateFromTemplate={handleCreateFromTemplate}
      />
    </div>
  );
}
