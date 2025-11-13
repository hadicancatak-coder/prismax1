import { useState, useEffect, memo } from "react";
import { FixedSizeList as List } from "react-window";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskDialog } from "./TaskDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreVertical, Trash2, CheckCircle, Copy, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TasksTableVirtualizedProps {
  tasks: any[];
  onTaskUpdate: () => void;
}

const ROW_HEIGHT = 72;

export const TasksTableVirtualized = ({ tasks, onTaskUpdate }: TasksTableVirtualizedProps) => {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'complete' | 'duplicate' | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      queryClient.setQueryData(['tasks'], (old: any) => 
        old?.filter((task: any) => task.id !== taskId)
      );
      return { previousTasks };
    },
    onError: (error: any, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({ 
        title: "Error deleting task", 
        description: error.message, 
        variant: "destructive" 
      });
    },
    onSuccess: () => {
      toast({ title: "Task deleted successfully" });
      setShowDeleteConfirm(null);
      setOpenDropdownId(null);
    },
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("user_id, name, avatar_url");
    setProfiles(data || []);
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  };

  const isDueToday = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due.toDateString() === today.toDateString();
  };

  const isDueTomorrow = (dueDate: string | null) => {
    if (!dueDate) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const due = new Date(dueDate);
    return due.toDateString() === tomorrow.toDateString();
  };

  const getRowBackgroundClass = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-success/5";
      case "Blocked":
        return "bg-destructive/5";
      case "Ongoing":
        return "bg-primary/5";
      case "Pending":
        return "bg-pending/5";
      default:
        return "";
    }
  };

  const statusColors = {
    Pending: "bg-pending/15 text-pending border-pending/30",
    Ongoing: "bg-primary/15 text-primary border-primary/30",
    Completed: "bg-success/15 text-success border-success/30",
    Failed: "bg-muted/15 text-muted-foreground border-muted/30",
    Blocked: "bg-destructive/15 text-destructive border-destructive/30",
  };

  const priorityColors = {
    High: "bg-destructive/15 text-destructive border-destructive/30",
    Medium: "bg-warning/15 text-warning border-warning/30",
    Low: "bg-success/15 text-success border-success/30",
  };

  const handleRowClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDialogOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showDeleteConfirm) {
      deleteMutation.mutate(showDeleteConfirm);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await supabase.from('tasks').update({ status: newStatus as any }).eq('id', taskId);
    onTaskUpdate();
  };

  const handlePriorityChange = async (taskId: string, newPriority: string) => {
    await supabase.from('tasks').update({ priority: newPriority as any }).eq('id', taskId);
    onTaskUpdate();
  };

  const handleMarkCompleted = async (taskId: string) => {
    setProcessingTaskId(taskId);
    setProcessingAction('complete');
    await supabase.from('tasks').update({ status: 'Completed' }).eq('id', taskId);
    onTaskUpdate();
    setProcessingTaskId(null);
    setProcessingAction(null);
    setOpenDropdownId(null);
    toast({ title: "Task marked as completed" });
  };

  const handleDuplicate = async (taskId: string) => {
    setProcessingTaskId(taskId);
    setProcessingAction('duplicate');
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const { data, error } = await supabase.from('tasks').insert([{
        title: `${task.title} (Copy)`,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_at: task.due_at,
        teams: task.teams,
        visibility: task.visibility
      }]).select();
      
      if (!error && data) {
        const assignees = task.assignees || [];
        if (assignees.length > 0) {
          await supabase.from('task_assignees').insert(
            assignees.map((a: any) => ({
              task_id: data[0].id,
              user_id: a.user_id
            }))
          );
        }
      }
      
      onTaskUpdate();
      toast({ title: "Task duplicated successfully" });
    }
    setProcessingTaskId(null);
    setProcessingAction(null);
    setOpenDropdownId(null);
  };

  const Row = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const task = tasks[index];
    
    return (
      <div
        style={style}
        className={cn(
          "flex items-center cursor-pointer hover:bg-muted/50 transition-all border-b border-border",
          getRowBackgroundClass(task.status),
          task.pending_approval && 'border-l-4 border-l-primary',
          isOverdue(task.due_at, task.status) && 'border-l-4 border-l-destructive',
          isDueToday(task.due_at) && 'border-l-4 border-l-warning',
          isDueTomorrow(task.due_at) && 'border-l-4 border-l-accent'
        )}
        onClick={() => handleRowClick(task.id)}
      >
        {/* Task Title */}
        <div
          className="flex-1 px-4 py-2"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingTaskId(task.id);
            setEditValue(task.title);
          }}
        >
          {editingTaskId === task.id ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={async () => {
                await supabase.from('tasks').update({ title: editValue }).eq('id', task.id);
                setEditingTaskId(null);
                onTaskUpdate();
              }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  await supabase.from('tasks').update({ title: editValue }).eq('id', task.id);
                  setEditingTaskId(null);
                  onTaskUpdate();
                }
                if (e.key === 'Escape') {
                  setEditingTaskId(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="h-8"
            />
          ) : (
            <div className="font-medium text-sm text-foreground">{task.title}</div>
          )}
        </div>

        {/* Description */}
        <div className="hidden xl:block flex-1 px-4 py-2">
          <div className="text-sm text-muted-foreground line-clamp-2">{task.description}</div>
        </div>

        {/* Status */}
        <div className="w-[100px] px-2" onClick={(e) => e.stopPropagation()}>
          <Select
            value={task.status}
            onValueChange={(value) => handleStatusChange(task.id, value)}
          >
            <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-muted/50">
              <Badge className={cn("text-xs font-medium border", statusColors[task.status as keyof typeof statusColors])}>
                {task.status}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Ongoing">Ongoing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="hidden md:block w-[90px] px-2" onClick={(e) => e.stopPropagation()}>
          <Select
            value={task.priority}
            onValueChange={(value) => handlePriorityChange(task.id, value)}
          >
            <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-muted/50">
              <Badge className={cn("text-xs font-medium border", priorityColors[task.priority as keyof typeof priorityColors])}>
                {task.priority}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assignees */}
        <div className="hidden lg:block w-[120px] px-2">
          <div className="flex -space-x-2">
            {task.assignees?.slice(0, 3).map((assignee: any) => (
              <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={assignee.avatar_url} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {assignee.name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            ))}
            {(task.assignees?.length || 0) > 3 && (
              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        </div>

        {/* Due Date */}
        <div className="w-[100px] px-2">
          <div className="text-xs text-muted-foreground">
            {task.due_at ? format(new Date(task.due_at), 'MMM dd') : '-'}
          </div>
        </div>

        {/* Actions */}
        <div className="w-[50px] px-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu open={openDropdownId === task.id} onOpenChange={(open) => setOpenDropdownId(open ? task.id : null)}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleMarkCompleted(task.id)} disabled={processingTaskId === task.id && processingAction === 'complete'}>
                {processingTaskId === task.id && processingAction === 'complete' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Mark Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(task.id)} disabled={processingTaskId === task.id && processingAction === 'duplicate'}>
                {processingTaskId === task.id && processingAction === 'duplicate' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteConfirm(task.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  });

  Row.displayName = 'VirtualizedTaskRow';

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Table Header */}
        <div className="flex items-center bg-muted/50 border-b border-border sticky top-0 z-10 h-10">
          <div className="flex-1 px-4 font-semibold text-xs">Task</div>
          <div className="hidden xl:block flex-1 px-4 font-semibold text-xs">Description</div>
          <div className="w-[100px] px-2 font-semibold text-xs">Status</div>
          <div className="hidden md:block w-[90px] px-2 font-semibold text-xs">Priority</div>
          <div className="hidden lg:block w-[120px] px-2 font-semibold text-xs">Assignee</div>
          <div className="w-[100px] px-2 font-semibold text-xs">Due Date</div>
          <div className="w-[50px] px-2"></div>
        </div>

        {/* Virtualized List */}
        <List
          height={600}
          itemCount={tasks.length}
          itemSize={ROW_HEIGHT}
          width="100%"
          overscanCount={5}
        >
          {Row}
        </List>
      </div>

      {/* Dialogs */}
      <TaskDialog
        taskId={selectedTaskId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
