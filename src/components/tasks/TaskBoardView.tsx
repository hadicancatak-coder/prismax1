import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreVertical, CheckCircle, Copy, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskBoardViewProps {
  tasks: any[];
  onTaskClick: (taskId: string) => void;
  groupBy?: 'status' | 'date';
}

export const TaskBoardView = ({ tasks, onTaskClick, groupBy = 'status' }: TaskBoardViewProps) => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<{ taskId: string; action: 'complete' | 'duplicate' | 'delete' } | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  
  const statusGroups = ['Pending', 'Ongoing', 'Blocked', 'Completed', 'Failed'];
  const dateGroups = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Later'];
  
  const groups = groupBy === 'status' ? statusGroups : dateGroups;

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  };

  const getDateGroup = (task: any): string => {
    if (!task.due_at) return 'Later';
    const dueDate = new Date(task.due_at);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    if (dueDate < today && task.status !== 'Completed') return 'Overdue';
    if (dueDate.toDateString() === today.toDateString()) return 'Today';
    if (dueDate.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    if (dueDate <= weekFromNow) return 'This Week';
    return 'Later';
  };

  const filterTasksByGroup = (group: string) => {
    if (groupBy === 'status') {
      return tasks.filter(t => t.status === group);
    } else {
      return tasks.filter(t => getDateGroup(t) === group);
    }
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
    e.preventDefault();
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
      setShowDeleteConfirm(null);
      setOpenDropdown(null);
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const taskId = active.id as string;
    const targetGroup = over.id as string;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (groupBy === 'status') {
        // Update task status
        await supabase
          .from('tasks')
          .update({ status: targetGroup })
          .eq('id', taskId);
        
        toast({
          title: "Task moved",
          description: `Task moved to ${targetGroup}`,
        });
      } else {
        // Update task date based on date group
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let newDate: Date;
        
        switch (targetGroup) {
          case 'Today':
            newDate = today;
            break;
          case 'Tomorrow':
            newDate = addDays(today, 1);
            break;
          case 'This Week':
            newDate = addDays(today, 3);
            break;
          case 'Later':
            newDate = addDays(today, 14);
            break;
          default:
            return;
        }
        
        await supabase
          .from('tasks')
          .update({ due_at: newDate.toISOString() })
          .eq('id', taskId);
        
        toast({
          title: "Due date updated",
          description: `Task moved to ${targetGroup}`,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {groups.map(group => {
        const groupTasks = filterTasksByGroup(group);
        const color = groupBy === 'status' ? statusColors[group] : 'bg-muted/30';
        
        return (
          <SortableContext key={group} id={group} items={[group]} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col min-h-[600px]">
              <div className={cn("rounded-t-lg p-3 border-b", color)}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{group}</h3>
                  <Badge variant="secondary">
                    {groupTasks.length}
                  </Badge>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-2 bg-muted/20 rounded-b-lg">
                <div className="space-y-2">
                {groupTasks.map(task => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task.id)}
                    onComplete={(e) => handleComplete(task, e)}
                    onDuplicate={(e) => handleDuplicate(task, e)}
                    onDelete={() => setShowDeleteConfirm(task.id)}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    processingAction={processingAction}
                    priorityColors={priorityColors}
                    showDeleteConfirm={showDeleteConfirm}
                    setShowDeleteConfirm={setShowDeleteConfirm}
                    handleDelete={handleDelete}
                  />
                ))}
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
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowDeleteConfirm(task.id);
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
        );
      })}

      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
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
              disabled={processingAction?.action === 'delete'}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                const task = tasks.find(t => t.id === showDeleteConfirm);
                if (task) handleDelete(task, e);
              }}
              disabled={processingAction?.action === 'delete'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processingAction?.action === 'delete' ? (
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
    </div>
  );
};
