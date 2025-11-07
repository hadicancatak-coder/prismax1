import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Calendar, MoreVertical, CheckCircle, Copy, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface TaskCardProps {
  task: any;
  onClick: () => void;
}

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [processingAction, setProcessingAction] = useState<'complete' | 'duplicate' | 'delete' | null>(null);
  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'hsl(var(--destructive))';
      case 'Medium': return 'hsl(45 93% 47%)';
      case 'Low': return 'hsl(142 71% 45%)';
      default: return 'hsl(var(--muted))';
    }
  };

  const statusColors = {
    Pending: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    Ongoing: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    Completed: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
    Failed: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
    Blocked: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  };

  const priorityColors = {
    High: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
    Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    Low: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
  };

  const handleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setProcessingAction('complete');
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'Completed' })
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task marked as completed",
      });

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingAction(null);
      setOpenDropdown(false);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault();
    setProcessingAction('duplicate');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: duplicatedTask, error } = await supabase
        .from('tasks')
        .insert({
          ...task,
          id: undefined,
          title: `${task.title} (Copy)`,
          created_by: user.id,
          created_at: undefined,
          updated_at: undefined,
        })
        .select()
        .single();

      if (error) throw error;

      if (task.assignees?.length > 0 && duplicatedTask) {
        const assigneeInserts = task.assignees.map((assignee: any) => ({
          task_id: duplicatedTask.id,
          user_id: assignee.user_id,
          assigned_by: user.id,
        }));

        await supabase.from('task_assignees').insert(assigneeInserts);
      }

      toast({
        title: "Success",
        description: "Task duplicated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingAction(null);
      setOpenDropdown(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProcessingAction('delete');
    try {
      if (userRole === 'admin') {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', task.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        const { error } = await supabase
          .from('tasks')
          .update({
            delete_requested_by: user.id,
            delete_requested_at: new Date().toISOString(),
          })
          .eq('id', task.id);

        if (error) throw error;

        toast({
          title: "Delete Request Sent",
          description: "Admin will review your request",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowDeleteConfirm(false);
      setOpenDropdown(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <Card 
      className="p-5 hover:shadow-lg transition-shadow duration-200 border-l-4 relative group"
      style={{ borderLeftColor: getPriorityColor(task.priority) }}
    >
      {/* Priority and Status badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={priorityColors[task.priority as keyof typeof priorityColors]}>
            {task.priority}
          </Badge>
          <Badge variant="outline" className={statusColors[task.status as keyof typeof statusColors]}>
            {task.status}
          </Badge>
          {task.visibility && (
            <Badge variant={task.visibility === 'global' ? 'default' : 'secondary'} className="text-xs">
              {task.visibility === 'global' ? 'Global' : 'Private'}
            </Badge>
          )}
        </div>

        <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
          <DropdownMenuTrigger 
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleComplete} disabled={processingAction !== null}>
              {processingAction === 'complete' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Mark Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate} disabled={processingAction !== null}>
              {processingAction === 'duplicate' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }} 
              disabled={processingAction !== null} 
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {userRole === 'admin' ? 'Delete' : 'Request Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Task title */}
      <h3 className="font-semibold text-lg mb-2 line-clamp-2 cursor-pointer" onClick={onClick}>
        {task.title}
      </h3>
      
      {/* Task description */}
      {task.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 cursor-pointer" onClick={onClick}>
          {task.description}
        </p>
      )}
      
      {/* Footer with metadata */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t cursor-pointer" onClick={onClick}>
        <div className="flex items-center -space-x-2">
          {task.assignees?.slice(0, 3).map((assignee: any) => (
            <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
              <AvatarImage src={assignee.avatar_url} />
              <AvatarFallback className="text-xs">{assignee.name?.[0]}</AvatarFallback>
            </Avatar>
          ))}
          {task.assignees?.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
              <span className="text-[10px] font-medium">+{task.assignees.length - 3}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.comments_count > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.comments_count}
            </div>
          )}
          {task.due_at && (
            <div className={cn(
              "flex items-center gap-1",
              isOverdue(task.due_at, task.status) && "text-destructive font-medium"
            )}>
              <Calendar className="h-3 w-3" />
              {format(new Date(task.due_at), 'MMM d')}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="z-[9999]" onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {userRole === 'admin' 
                ? 'This will permanently delete this task. This action cannot be undone.'
                : 'This will send a delete request to an admin for review.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={processingAction === 'delete'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={processingAction === 'delete'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processingAction === 'delete' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {userRole === 'admin' ? 'Deleting...' : 'Requesting...'}
                </>
              ) : (
                userRole === 'admin' ? 'Delete Task' : 'Request Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
