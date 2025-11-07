import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCircle, Copy, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface TaskBoardViewProps {
  tasks: any[];
  onTaskClick: (taskId: string) => void;
}

export const TaskBoardView = ({ tasks, onTaskClick }: TaskBoardViewProps) => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<{ taskId: string; action: 'complete' | 'duplicate' | 'delete' } | null>(null);
  const statuses = ['Pending', 'Ongoing', 'Blocked', 'Completed', 'Failed'];

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  };

  const priorityColors = {
    High: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
    Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    Low: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
  };

  const statusColors: Record<string, string> = {
    Pending: "bg-blue-500/20",
    Ongoing: "bg-purple-500/20",
    Blocked: "bg-orange-500/20",
    Completed: "bg-green-500/20",
    Failed: "bg-red-500/20",
  };

  const handleComplete = async (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingAction({ taskId: task.id, action: 'complete' });
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
      setOpenDropdown(null);
    }
  };

  const handleDuplicate = async (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingAction({ taskId: task.id, action: 'duplicate' });
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
      setOpenDropdown(null);
    }
  };

  const handleDelete = async (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingAction({ taskId: task.id, action: 'delete' });
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingAction(null);
      setOpenDropdown(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {statuses.map(status => (
        <div key={status} className="flex flex-col min-h-[600px]">
          <div className={cn("rounded-t-lg p-3 border-b", statusColors[status])}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{status}</h3>
              <Badge variant="secondary">
                {tasks.filter(t => t.status === status).length}
              </Badge>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-2 bg-muted/20 rounded-b-lg">
            <div className="space-y-2">
              {tasks
                .filter(t => t.status === status)
                .map(task => (
                  <Card 
                    key={task.id}
                    className="p-3 hover:shadow-md transition-shadow animate-fade-in relative group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge 
                        variant="outline"
                        className={cn(priorityColors[task.priority as keyof typeof priorityColors])}
                      >
                        {task.priority}
                      </Badge>

                      <DropdownMenu open={openDropdown === task.id} onOpenChange={(open) => setOpenDropdown(open ? task.id : null)}>
                        <DropdownMenuTrigger 
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={(e) => handleComplete(task, e)} 
                            disabled={processingAction !== null}
                          >
                            {processingAction?.taskId === task.id && processingAction?.action === 'complete' ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleDuplicate(task, e)} 
                            disabled={processingAction !== null}
                          >
                            {processingAction?.taskId === task.id && processingAction?.action === 'duplicate' ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Copy className="mr-2 h-4 w-4" />
                            )}
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => handleDelete(task, e)} 
                            disabled={processingAction !== null} 
                            className="text-destructive"
                          >
                            {processingAction?.taskId === task.id && processingAction?.action === 'delete' ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            {userRole === 'admin' ? 'Delete' : 'Request Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="font-medium mt-2 text-sm line-clamp-2 cursor-pointer" onClick={() => onTaskClick(task.id)}>
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between mt-3 cursor-pointer" onClick={() => onTaskClick(task.id)}>
                      <div className="flex -space-x-2">
                        {task.assignees?.slice(0, 3).map((assignee: any) => (
                          <Avatar key={assignee.user_id} className="h-5 w-5 border-2 border-background">
                            <AvatarImage src={assignee.avatar_url} />
                            <AvatarFallback className="text-[10px]">
                              {assignee.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {task.assignees?.length > 3 && (
                          <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-[8px] font-medium">+{task.assignees.length - 3}</span>
                          </div>
                        )}
                      </div>
                      {task.due_at && (
                        <span className={cn(
                          "text-xs",
                          isOverdue(task.due_at, task.status) && "text-destructive font-medium"
                        )}>
                          {format(new Date(task.due_at), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
};
