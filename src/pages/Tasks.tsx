import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { JiraTasksTable } from "@/components/JiraTasksTable";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { AssigneeFilterBar } from "@/components/AssigneeFilterBar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
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
      
      // Get comment counts
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
    const assigneeMatch = selectedAssignees.length === 0 || 
      selectedAssignees.includes(task.assignee_id);
    const teamMatch = selectedTeams.length === 0;
    return assigneeMatch && teamMatch;
  });

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

      {loading ? (
        <div className="text-center py-12">Loading tasks...</div>
      ) : (
        <JiraTasksTable tasks={filteredTasks} onTaskUpdate={fetchTasks} />
      )}

      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
