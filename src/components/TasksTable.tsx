import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { UnifiedTaskDialog } from "./UnifiedTaskDialog";
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
import { MoreVertical, Trash2, CheckCircle, Copy, Loader2, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  const { updateStatus, updatePriority, completeTask } = useTaskMutations();
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
    if (!dueDate || status === 'Completed' || status === 'Backlog') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
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

  // Apple-style row backgrounds - clean white, accent bar for special states
  const getRowClasses = (task: any) => {
    const base = "bg-white hover:bg-[#fafafa] transition-all";
    if (isOverdue(task.due_at, task.status)) {
      return `${base} border-l-4 border-l-[#ff3b30]`;
    }
    if (task.status === "Blocked") {
      return `${base} border-l-4 border-l-[#ff9500]`;
    }
    if (isDueToday(task.due_at)) {
      return `${base} border-l-4 border-l-[#007aff]`;
    }
    return base;
  };

  const statusColors: Record<string, string> = {
    Pending: "bg-[#007aff]/10 text-[#007aff] border-[#007aff]/20",
    Ongoing: "bg-[#34c759]/10 text-[#34c759] border-[#34c759]/20",
    Completed: "bg-[#8e8e93]/10 text-[#8e8e93] border-[#8e8e93]/20",
    Failed: "bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20",
    Blocked: "bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20",
    Backlog: "bg-[#8e8e93]/10 text-[#8e8e93] border-[#8e8e93]/20",
  };

  const priorityColors: Record<string, string> = {
    High: "bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20",
    Medium: "bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20",
    Low: "bg-[#34c759]/10 text-[#34c759] border-[#34c759]/20",
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
          <TableHeader>
            <TableRow className="bg-[#f9f9f9] border-b border-[#e6e6e6]">
              <TableHead className="w-[40px] py-3">
                <Checkbox
                  checked={selectedIds?.length === tasks.length && tasks.length > 0}
                  onCheckedChange={(checked) => {
                    onSelectionChange?.(checked ? tasks.map(t => t.id) : []);
                  }}
                />
              </TableHead>
              <TableHead className="font-semibold text-xs text-[#6e6e73] w-auto py-3">Task</TableHead>
              <TableHead className="font-semibold text-xs text-[#6e6e73] w-auto hidden xl:table-cell py-3">Description</TableHead>
              <TableHead className="font-semibold text-xs text-[#6e6e73] w-[100px] py-3">Status</TableHead>
              <TableHead className="font-semibold text-xs text-[#6e6e73] w-[90px] hidden md:table-cell py-3">Priority</TableHead>
              <TableHead className="font-semibold text-xs text-[#6e6e73] w-[120px] hidden lg:table-cell py-3">Assignee</TableHead>
              <TableHead className="font-semibold text-xs text-[#6e6e73] w-[100px] py-3">Due Date</TableHead>
              <TableHead className="w-[50px] py-3"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow
                key={task.id}
                className={cn(
                  "cursor-pointer h-14 border-t border-[#e6e6e6]",
                  getRowClasses(task),
                  task.pending_approval && 'border-l-4 border-l-[#007aff]'
                )}
                onClick={() => handleRowClick(task.id)}
              >
                <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
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
                  className="py-4 px-3"
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
                      className="border-[#e5e5ea]"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {isOverdue(task.due_at, task.status) && (
                        <AlertTriangle className="h-4 w-4 text-[#ff3b30] flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-[#1c1c1e] truncate">{task.title}</span>
                      {task.pending_approval && (
                        <Badge variant="default" className="text-xs px-2.5 py-0.5 bg-[#007aff] text-white">
                          Pending
                        </Badge>
                      )}
                      {task.comments_count > 0 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1 border-[#e5e5ea] text-[#6e6e73]">
                          <span>💬</span>
                          <span>{task.comments_count}</span>
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-4 px-3 hidden xl:table-cell">
                  {task.description ? (
                    <p className="text-[13px] text-[#6e6e73] line-clamp-1">
                      {task.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                    </p>
                  ) : (
                    <span className="text-[13px] text-[#8e8e93]">-</span>
                  )}
                </TableCell>
                <TableCell className="py-4 px-3" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={task.status}
                    onValueChange={(newStatus: any) => {
                      updateStatus.mutate({ id: task.id, status: newStatus });
                    }}
                    disabled={updateStatus.isPending}
                  >
                    <SelectTrigger className="h-7 w-[100px] text-[11px] rounded-full border-[#e5e5ea] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#e5e5ea]">
                      <SelectItem value="Backlog" className="text-[13px]">Backlog</SelectItem>
                      <SelectItem value="Ongoing" className="text-[13px]">Ongoing</SelectItem>
                      <SelectItem value="Completed" className="text-[13px]">Completed</SelectItem>
                      <SelectItem value="Failed" className="text-[13px]">Failed</SelectItem>
                      <SelectItem value="Blocked" className="text-[13px]">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden md:table-cell py-4 px-3" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={task.priority}
                    onValueChange={(newPriority: any) => {
                      updatePriority.mutate({ id: task.id, priority: newPriority });
                    }}
                    disabled={updatePriority.isPending}
                  >
                    <SelectTrigger className="h-7 w-[90px] text-[11px] rounded-full border-[#e5e5ea] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#e5e5ea]">
                      <SelectItem value="Low" className="text-[13px]">Low</SelectItem>
                      <SelectItem value="Medium" className="text-[13px]">Medium</SelectItem>
                      <SelectItem value="High" className="text-[13px]">High</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()} className="hidden lg:table-cell py-4 px-3">
                  {task.assignees && task.assignees.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {task.assignees.slice(0, 3).map((assignee: any) => (
                        <Avatar key={assignee.id} className="h-6 w-6 border border-[#e5e5ea]">
                          <AvatarImage src={assignee.avatar_url} />
                          <AvatarFallback className="text-[10px] bg-[#f2f2f7] text-[#6e6e73]">
                            {assignee.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {task.assignees.length > 3 && (
                        <span className="text-[11px] text-[#6e6e73] ml-1">
                          +{task.assignees.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[13px] text-[#8e8e93]">-</span>
                  )}
                </TableCell>
                <TableCell className="text-[13px] text-[#1c1c1e] py-4 px-3">
                  {task.due_at ? format(new Date(task.due_at), "MMM dd") : "-"}
                </TableCell>
                <TableCell className="py-4 px-2">
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
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setProcessingTaskId(task.id);
                          setProcessingAction('complete');
                          
                          completeTask.mutate(task.id, {
                            onSuccess: () => {
                              setProcessingTaskId(null);
                              setProcessingAction(null);
                              setOpenDropdownId(null);
                            },
                            onError: () => {
                              setProcessingTaskId(null);
                              setProcessingAction(null);
                            }
                          });
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
        <UnifiedTaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode="view"
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
