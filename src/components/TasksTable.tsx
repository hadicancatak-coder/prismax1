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

  // Row styling with semantic tokens
  const getRowClasses = (task: any) => {
    const base = "bg-card hover:bg-card-hover transition-all";
    if (isOverdue(task.due_at, task.status)) {
      return `${base} border-l-4 border-l-destructive`;
    }
    if (task.status === "Blocked") {
      return `${base} border-l-4 border-l-warning`;
    }
    if (isDueToday(task.due_at)) {
      return `${base} border-l-4 border-l-primary`;
    }
    return base;
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
      <div className="w-full overflow-hidden">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow className="bg-muted border-b border-border">
              <TableHead className="w-[40px] py-3">
                <Checkbox
                  checked={selectedIds?.length === tasks.length && tasks.length > 0}
                  onCheckedChange={(checked) => {
                    onSelectionChange?.(checked ? tasks.map(t => t.id) : []);
                  }}
                />
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground py-3" style={{ width: '30%' }}>Task</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground py-3 hidden xl:table-cell" style={{ width: '25%' }}>Description</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground py-3" style={{ width: '100px' }}>Status</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground py-3 hidden md:table-cell" style={{ width: '90px' }}>Priority</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground py-3 hidden lg:table-cell" style={{ width: '100px' }}>Assignee</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground py-3" style={{ width: '90px' }}>Due Date</TableHead>
              <TableHead className="py-3" style={{ width: '50px' }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow
                key={task.id}
                className={cn(
                  "cursor-pointer h-14 border-t border-border",
                  getRowClasses(task),
                  task.pending_approval && 'border-l-4 border-l-primary'
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
                      className="border-border"
                    />
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      {isOverdue(task.due_at, task.status) && (
                        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                      {task.pending_approval && (
                        <Badge variant="default" className="text-xs px-2.5 py-0.5 flex-shrink-0">
                          Pending
                        </Badge>
                      )}
                      {task.comments_count > 0 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 flex items-center gap-1 flex-shrink-0">
                          <span>💬</span>
                          <span>{task.comments_count}</span>
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-4 px-3 hidden xl:table-cell">
                  {task.description ? (
                    <p className="text-[13px] text-muted-foreground line-clamp-1 truncate">
                      {task.description.replace(/<[^>]*>/g, '').substring(0, 80)}
                    </p>
                  ) : (
                    <span className="text-[13px] text-muted-foreground">-</span>
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
                    <SelectTrigger className="h-7 w-[90px] text-[11px] rounded-full border-border bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-popover shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
                      <SelectItem value="Backlog" className="text-[13px]">Backlog</SelectItem>
                      <SelectItem value="Pending" className="text-[13px]">Pending</SelectItem>
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
                    <SelectTrigger className="h-7 w-[80px] text-[11px] rounded-full border-border bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border bg-popover shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
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
                        <Avatar key={assignee.id} className="h-6 w-6 border border-border">
                          <AvatarImage src={assignee.avatar_url} />
                          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                            {assignee.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {task.assignees.length > 3 && (
                        <span className="text-[11px] text-muted-foreground ml-1">
                          +{task.assignees.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[13px] text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-[13px] text-foreground py-4 px-3">
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
                    <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
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
                              description: "Failed to fetch task details for duplication",
                              variant: "destructive"
                            });
                            setProcessingTaskId(null);
                            setProcessingAction(null);
                            return;
                          }
                          
                          const { id, created_at, updated_at, ...taskData } = originalTask;
                          
                          const { error: insertError } = await supabase
                            .from('tasks')
                            .insert([{
                              ...taskData,
                              title: `${taskData.title} (Copy)`,
                              status: 'Pending',
                            }]);
                          
                          if (insertError) {
                            toast({
                              title: "Error",
                              description: "Failed to duplicate task",
                              variant: "destructive"
                            });
                          } else {
                            toast({ title: "Task duplicated successfully" });
                            onTaskUpdate();
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
                            Duplicate Task
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowDeleteConfirm(task.id);
                        }}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        disabled={processingTaskId !== null}
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
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task Dialog */}
      {selectedTaskId && (
        <UnifiedTaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode="view"
          taskId={selectedTaskId}
        />
      )}
    </>
  );
};
