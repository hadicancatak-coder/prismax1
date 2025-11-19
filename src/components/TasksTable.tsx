import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TasksTableProps {
  tasks: any[];
  onTaskUpdate: () => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export const TasksTable = ({ tasks, onTaskUpdate, selectedIds = [], onSelectionChange }: TasksTableProps) => {
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

  // Delete mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onMutate: async (taskId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // Optimistically update
      queryClient.setQueryData(['tasks'], (old: any) => 
        old?.filter((task: any) => task.id !== taskId)
      );
      
      return { previousTasks };
    },
    onError: (error: any, taskId, context) => {
      // Rollback on error
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
    onSettled: () => {
      // Realtime subscription in useTasks.ts handles invalidation
    }
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

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="table-auto w-full">
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedIds?.length === tasks.length && tasks.length > 0}
                  onCheckedChange={(checked) => {
                    onSelectionChange?.(checked ? tasks.map(t => t.id) : []);
                  }}
                />
              </TableHead>
              <TableHead className="font-semibold text-xs w-auto">Task</TableHead>
              <TableHead className="font-semibold text-xs w-auto hidden xl:table-cell">Description</TableHead>
              <TableHead className="font-semibold text-xs w-[100px]">Status</TableHead>
              <TableHead className="font-semibold text-xs w-[90px] hidden md:table-cell">Priority</TableHead>
              <TableHead className="font-semibold text-xs w-[120px] hidden lg:table-cell">Assignee</TableHead>
              <TableHead className="font-semibold text-xs w-[100px]">Due Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow
                key={task.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-all h-10 border-b border-border last:border-0",
                  getRowBackgroundClass(task.status),
                  task.pending_approval && 'border-l-4 border-l-primary',
                  isOverdue(task.due_at, task.status) && 'border-l-4 border-l-destructive',
                  isDueToday(task.due_at) && 'border-l-4 border-l-warning',
                  isDueTomorrow(task.due_at) && 'border-l-4 border-l-accent'
                )}
                onClick={() => handleRowClick(task.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds?.includes(task.id) || false}
                    onCheckedChange={(checked) => {
                      onSelectionChange?.(
                        checked 
                          ? [...(selectedIds || []), task.id]
                          : (selectedIds || []).filter(id => id !== task.id)
                      );
                    }}
                  />
                </TableCell>
                <TableCell
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                        if (e.key === 'Escape') {
                          setEditingTaskId(null);
                        }
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{task.title}</span>
                      {task.pending_approval && (
                        <Badge variant="default" className="text-xs px-2.5 py-0.5">
                          Pending
                        </Badge>
                      )}
                      {task.comments_count > 0 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1">
                          <span>💬</span>
                          <span>{task.comments_count}</span>
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-1.5 px-3 hidden xl:table-cell">
                  {task.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {task.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                    </p>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="py-1.5 px-3" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={task.status}
                    onValueChange={async (newStatus: any) => {
                      const { error } = await supabase
                        .from("tasks")
                        .update({ status: newStatus as any })
                        .eq("id", task.id);
                      
                      if (error) {
                        toast({
                          title: "Error updating status",
                          description: error.message,
                          variant: "destructive",
                        });
                      } else {
                        queryClient.invalidateQueries({ queryKey: ['tasks'] });
                        toast({ title: "Status updated" });
                      }
                    }}
                  >
                    <SelectTrigger className="h-6 w-[100px] text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden md:table-cell py-1.5 px-3" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={task.priority}
                    onValueChange={async (newPriority: any) => {
                      const { error } = await supabase
                        .from("tasks")
                        .update({ priority: newPriority as any })
                        .eq("id", task.id);
                      
                      if (error) {
                        toast({
                          title: "Error updating priority",
                          description: error.message,
                          variant: "destructive",
                        });
                      } else {
                        queryClient.invalidateQueries({ queryKey: ['tasks'] });
                        toast({ title: "Priority updated" });
                      }
                    }}
                  >
                    <SelectTrigger className="h-6 w-[90px] text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} className="hidden lg:table-cell py-1.5 px-3">
                  {task.assignees && task.assignees.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {task.assignees.slice(0, 3).map((assignee: any) => (
                        <Avatar key={assignee.id} className="h-5 w-5 border">
                          <AvatarImage src={assignee.avatar_url} />
                          <AvatarFallback className="text-[10px]">
                            {assignee.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {task.assignees.length > 3 && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          +{task.assignees.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs py-1.5 px-3">
                  {task.due_at ? format(new Date(task.due_at), "MMM dd") : "-"}
                </TableCell>
                <TableCell className="py-1.5 px-2">
                  <DropdownMenu 
                    open={openDropdownId === task.id}
                    onOpenChange={(open) => {
                      if (!processingTaskId) {
                        setOpenDropdownId(open ? task.id : null);
                      }
                    }}
                  >
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {userRole === 'admin' && (
                        <>
                          <DropdownMenuItem 
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setProcessingTaskId(task.id);
                              setProcessingAction('complete');
                              
                              const { error } = await supabase
                                .from('tasks')
                                .update({ status: 'Completed' })
                                .eq('id', task.id);
                              
                              if (error) {
                                toast({
                                  title: "Error",
                                  description: error.message,
                                  variant: "destructive",
                                });
                              } else {
                                toast({ title: "Task marked as completed" });
                              }
                              
                              setProcessingTaskId(null);
                              setProcessingAction(null);
                              setOpenDropdownId(null);
                            }}
                            disabled={processingTaskId !== null}
                          >
                            {processingTaskId === task.id && processingAction === 'complete' ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Completing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Completed
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setProcessingTaskId(task.id);
                              setProcessingAction('duplicate');
                              
                              const { data: originalTask, error: fetchError } = await supabase
                                .from('tasks')
                                .select('*')
                                .eq('id', task.id)
                                .single();
                              
                              if (fetchError) {
                                toast({
                                  title: "Error",
                                  description: fetchError.message,
                                  variant: "destructive",
                                });
                                setProcessingTaskId(null);
                                setProcessingAction(null);
                                setOpenDropdownId(null);
                                return;
                              }
                              
                              const { id, created_at, updated_at, ...taskData } = originalTask;
                              const { error } = await supabase
                                .from('tasks')
                                .insert({
                                  ...taskData,
                                  title: `${taskData.title} (Copy)`,
                                });
                              
                              if (error) {
                                toast({
                                  title: "Error",
                                  description: error.message,
                                  variant: "destructive",
                                });
                              } else {
                                toast({ title: "Task duplicated successfully" });
                              }
                              
                              setProcessingTaskId(null);
                              setProcessingAction(null);
                              setOpenDropdownId(null);
                            }}
                            disabled={processingTaskId !== null}
                          >
                            {processingTaskId === task.id && processingAction === 'duplicate' ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Duplicating...
                              </>
                            ) : (
                              <>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </>
                            )}
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setShowDeleteConfirm(task.id);
                        }}
                        disabled={deleteMutation.isPending || processingTaskId !== null}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {tasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No tasks found
          </div>
        )}
      </div>

      {selectedTaskId && (
        <TaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          taskId={selectedTaskId}
        />
      )}
      
      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <AlertDialogContent className="z-[9999]" onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
