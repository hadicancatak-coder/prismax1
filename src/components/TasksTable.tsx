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
import { MoreVertical, Trash2, CheckCircle, Copy, Loader2, AlertTriangle, Circle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { TASK_TAGS } from "@/lib/constants";

interface TasksTableProps {
  tasks: any[];
  onTaskUpdate: () => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const priorityConfig = {
  High: { color: "text-destructive", dot: "bg-destructive" },
  Medium: { color: "text-warning", dot: "bg-warning" },
  Low: { color: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const statusConfig: Record<string, { bg: string; text: string }> = {
  Backlog: { bg: "bg-muted/50", text: "text-muted-foreground" },
  Pending: { bg: "bg-info/15", text: "text-info" },
  Ongoing: { bg: "bg-purple-soft", text: "text-purple-600 dark:text-purple-400" },
  Blocked: { bg: "bg-warning/15", text: "text-warning" },
  Completed: { bg: "bg-success/15", text: "text-success" },
  Failed: { bg: "bg-destructive/15", text: "text-destructive" },
};

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
    return isToday(new Date(dueDate));
  };

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

  const getDueDateDisplay = (dueDate: string | null, status: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const overdue = isOverdue(dueDate, status);
    const today = isToday(date);
    const tomorrow = isTomorrow(date);
    const daysDiff = differenceInDays(date, new Date());

    let label = format(date, "MMM dd");
    let subLabel = "";
    let colorClass = "text-foreground";

    if (overdue) {
      const daysAgo = Math.abs(daysDiff);
      subLabel = daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;
      colorClass = "text-destructive";
    } else if (today) {
      subLabel = "Today";
      colorClass = "text-primary";
    } else if (tomorrow) {
      subLabel = "Tomorrow";
      colorClass = "text-warning";
    } else if (daysDiff <= 7) {
      subLabel = `${daysDiff}d`;
    }

    return { label, subLabel, colorClass };
  };

  const getTagBadges = (labels: string[] | null) => {
    if (!labels || labels.length === 0) return null;
    const maxDisplay = 2;
    const displayTags = labels.slice(0, maxDisplay);
    const remaining = labels.length - maxDisplay;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {displayTags.map((label) => {
          const tagDef = TASK_TAGS.find(t => t.value === label);
          return (
            <Badge
              key={label}
              variant="outline"
              className={cn(
                "text-metadata px-1.5 py-0 h-5 font-medium border",
                tagDef?.color || "bg-muted/50 text-muted-foreground border-border"
              )}
            >
              {tagDef?.label || label}
            </Badge>
          );
        })}
        {remaining > 0 && (
          <span className="text-metadata text-muted-foreground">+{remaining}</span>
        )}
      </div>
    );
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
            <TableRow className="bg-muted/50 border-b border-border">
              <TableHead className="w-[44px] py-4 px-4">
                <Checkbox
                  checked={selectedIds?.length === tasks.length && tasks.length > 0}
                  onCheckedChange={(checked) => {
                    onSelectionChange?.(checked ? tasks.map(t => t.id) : []);
                  }}
                />
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground py-4 px-4" style={{ width: '32%' }}>Task</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground py-4 px-3" style={{ width: '120px' }}>Tags</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground py-4 px-3" style={{ width: '100px' }}>Status</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground py-4 px-3 hidden md:table-cell" style={{ width: '90px' }}>Priority</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground py-4 px-3 hidden lg:table-cell" style={{ width: '110px' }}>Assignee</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground py-4 px-3" style={{ width: '100px' }}>Due Date</TableHead>
              <TableHead className="py-4 px-2" style={{ width: '50px' }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/50">
            {tasks.map((task) => {
              const dueDateInfo = getDueDateDisplay(task.due_at, task.status);
              const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.Low;
              const status = statusConfig[task.status] || statusConfig.Pending;

              return (
                <TableRow
                  key={task.id}
                  className={cn(
                    "cursor-pointer h-16",
                    getRowClasses(task),
                    task.pending_approval && 'border-l-4 border-l-primary'
                  )}
                  onClick={() => handleRowClick(task.id)}
                >
                  <TableCell className="py-5 px-4" onClick={(e) => e.stopPropagation()}>
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
                    className="py-5 px-4"
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
                          if (e.key === 'Enter') e.currentTarget.blur();
                          if (e.key === 'Escape') setEditingTaskId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="border-border"
                      />
                    ) : (
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Circle className={cn("h-2.5 w-2.5 flex-shrink-0 fill-current", priority.dot, priority.color)} />
                        {isOverdue(task.due_at, task.status) && (
                          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                        )}
                        <span className="text-body-sm font-medium text-foreground truncate">{task.title}</span>
                        {task.pending_approval && (
                          <Badge variant="default" className="text-metadata px-2 py-0 h-5 flex-shrink-0">
                            Pending
                          </Badge>
                        )}
                        {task.comments_count > 0 && (
                          <Badge variant="outline" className="text-metadata px-1.5 py-0 h-5 flex items-center gap-1 flex-shrink-0 border-border">
                            <span>💬</span>
                            <span>{task.comments_count}</span>
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-5 px-3">
                    {getTagBadges(task.labels)}
                  </TableCell>
                  <TableCell className="py-5 px-3" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={task.status}
                      onValueChange={(newStatus: any) => {
                        updateStatus.mutate({ id: task.id, status: newStatus });
                      }}
                      disabled={updateStatus.isPending}
                    >
                      <SelectTrigger className={cn(
                        "h-7 w-[90px] text-metadata font-medium rounded-full border-0",
                        status.bg, status.text
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border bg-popover shadow-lg">
                        <SelectItem value="Backlog" className="text-body-sm">Backlog</SelectItem>
                        <SelectItem value="Pending" className="text-body-sm">Pending</SelectItem>
                        <SelectItem value="Ongoing" className="text-body-sm">Ongoing</SelectItem>
                        <SelectItem value="Completed" className="text-body-sm">Completed</SelectItem>
                        <SelectItem value="Failed" className="text-body-sm">Failed</SelectItem>
                        <SelectItem value="Blocked" className="text-body-sm">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-5 px-3" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={task.priority}
                      onValueChange={(newPriority: any) => {
                        updatePriority.mutate({ id: task.id, priority: newPriority });
                      }}
                      disabled={updatePriority.isPending}
                    >
                      <SelectTrigger className="h-7 w-[80px] text-metadata rounded-full border-border bg-card">
                        <div className="flex items-center gap-1.5">
                          <Circle className={cn("h-2 w-2 fill-current", priority.dot, priority.color)} />
                          <span>{task.priority}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border bg-popover shadow-lg">
                        <SelectItem value="Low" className="text-body-sm">Low</SelectItem>
                        <SelectItem value="Medium" className="text-body-sm">Medium</SelectItem>
                        <SelectItem value="High" className="text-body-sm">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="hidden lg:table-cell py-5 px-3">
                    <div 
                      className="cursor-pointer hover:bg-muted/50 rounded-lg p-1.5 -m-1.5 transition-colors"
                      onClick={() => handleRowClick(task.id)}
                      title="Click to edit assignees"
                    >
                      {task.assignees && task.assignees.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {task.assignees.slice(0, 3).map((assignee: any) => (
                            <Avatar key={assignee.id} className="h-7 w-7 border-2 border-background">
                              <AvatarImage src={assignee.avatar_url} />
                              <AvatarFallback className="text-metadata bg-muted text-muted-foreground">
                                {assignee.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {task.assignees.length > 3 && (
                            <span className="text-metadata text-muted-foreground ml-0.5">
                              +{task.assignees.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-body-sm text-muted-foreground hover:text-foreground">+ Add</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-3" onClick={(e) => e.stopPropagation()}>
                    <div 
                      className="cursor-pointer hover:bg-muted/50 rounded-lg p-1.5 -m-1.5 transition-colors"
                      onClick={() => handleRowClick(task.id)}
                      title="Click to edit due date"
                    >
                      {dueDateInfo ? (
                        <div className={cn("flex flex-col", dueDateInfo.colorClass)}>
                          <span className="text-body-sm font-medium">{dueDateInfo.label}</span>
                          {dueDateInfo.subLabel && (
                            <span className="text-metadata opacity-80">{dueDateInfo.subLabel}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-body-sm text-muted-foreground hover:text-foreground">+ Add</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-2">
                    <DropdownMenu 
                      open={openDropdownId === task.id}
                      onOpenChange={(open) => {
                        if (!processingTaskId) {
                          setOpenDropdownId(open ? task.id : null);
                        }
                      }}
                    >
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover shadow-lg">
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
                            
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) {
                              toast({
                                title: "Error",
                                description: "User not found",
                                variant: "destructive"
                              });
                              setProcessingTaskId(null);
                              setProcessingAction(null);
                              return;
                            }
                            
                            const { id, created_at, updated_at, ...taskData } = originalTask;
                            const { error: insertError } = await supabase
                              .from('tasks')
                              .insert({
                                ...taskData,
                                title: `${task.title} (Copy)`,
                                created_by: user.id,
                              });
                            
                            if (insertError) {
                              toast({
                                title: "Error",
                                description: "Failed to duplicate task",
                                variant: "destructive"
                              });
                            } else {
                              toast({
                                title: "Success",
                                description: "Task duplicated successfully"
                              });
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
                              Duplicate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDeleteConfirm(task.id);
                          }}
                          disabled={processingTaskId !== null}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
        <AlertDialogContent className="z-overlay" onClick={(e) => e.stopPropagation()}>
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
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Task'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
