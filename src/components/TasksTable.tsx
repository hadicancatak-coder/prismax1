import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TaskDialog } from "./TaskDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreVertical, Trash2, CheckCircle, Copy } from "lucide-react";
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

interface TasksTableProps {
  tasks: any[];
  onTaskUpdate: () => void;
}

export const TasksTable = ({ tasks, onTaskUpdate }: TasksTableProps) => {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);

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

  const handleRowClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDialogOpen(true);
  };

  const handleDelete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      toast({ title: "Task deleted successfully" });
      onTaskUpdate();
    } catch (error: any) {
      toast({ title: "Error deleting task", description: error.message, variant: "destructive" });
    }
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Task</TableHead>
              <TableHead className="w-32 font-semibold">Status</TableHead>
              <TableHead className="w-32 font-semibold">Priority</TableHead>
              <TableHead className="w-48 font-semibold">Assignee</TableHead>
              <TableHead className="w-32 font-semibold">Due Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow
                key={task.id}
                className={`cursor-pointer hover:bg-muted/30 transition-colors ${
                  task.pending_approval ? 'border-l-4 border-l-blue-500 bg-blue-500/5' : ''
                } ${
                  isOverdue(task.due_at, task.status) ? 'border-l-4 border-l-red-500 bg-destructive/5' : ''
                } ${
                  isDueToday(task.due_at) ? 'border-l-4 border-l-yellow-500 bg-warning/5' : ''
                } ${
                  isDueTomorrow(task.due_at) ? 'border-l-4 border-l-orange-500 bg-orange-500/5' : ''
                }`}
                onClick={() => handleRowClick(task.id)}
              >
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{task.title}</div>
                        {task.pending_approval && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 text-xs">
                            ⏳ Pending
                          </Badge>
                        )}
                        {task.comments_count > 0 && (
                          <Badge variant="outline" className="bg-muted text-xs">
                            💬 {task.comments_count}
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[task.status as keyof typeof statusColors]}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={priorityColors[task.priority as keyof typeof priorityColors]}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {task.assignees && task.assignees.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {task.assignees.slice(0, 3).map((assignee: any) => (
                        <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={assignee.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {assignee.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {task.assignees.length > 3 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          +{task.assignees.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {task.due_at ? format(new Date(task.due_at), "MMM dd, yyyy") : "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {userRole === 'admin' && (
                        <>
                          <DropdownMenuItem onClick={async (e) => {
                            e.stopPropagation();
                            await supabase.from('tasks').update({ status: 'Completed' }).eq('id', task.id);
                            onTaskUpdate();
                          }}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async (e) => {
                            e.stopPropagation();
                            const { id, created_at, updated_at, ...taskData } = task;
                            await supabase.from('tasks').insert({ ...taskData, title: `${task.title} (Copy)` });
                            onTaskUpdate();
                          }}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={(e) => handleDelete(task.id, e)}>
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
    </>
  );
}
