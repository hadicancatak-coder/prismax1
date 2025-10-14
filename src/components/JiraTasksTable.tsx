import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, MoreHorizontal } from "lucide-react";
import { TaskDialog } from "./TaskDialog";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JiraTasksTableProps {
  tasks: any[];
  compact?: boolean;
  onTaskUpdate: () => void;
}

export function JiraTasksTable({ tasks, compact = true, onTaskUpdate }: JiraTasksTableProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const statusConfig = {
    "Pending": { color: "bg-muted text-muted-foreground", emoji: "📋" },
    "Ongoing": { color: "bg-warning/10 text-warning border-warning/20", emoji: "🔄" },
    "Completed": { color: "bg-success/10 text-success border-success/20", emoji: "✅" },
    "Failed": { color: "bg-destructive/10 text-destructive border-destructive/20", emoji: "❌" },
    "Blocked": { color: "bg-destructive/10 text-destructive border-destructive/20", emoji: "🚫" },
  };

  const priorityConfig = {
    High: { color: "bg-destructive/10 text-destructive border-destructive/20", emoji: "🔴" },
    Medium: { color: "bg-warning/10 text-warning border-warning/20", emoji: "🟡" },
    Low: { color: "bg-muted text-muted-foreground", emoji: "🟢" },
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
            <TableRow className={compact ? "h-8" : ""}>
              <TableHead className="w-12 font-semibold text-foreground">Type</TableHead>
              <TableHead className="w-24 font-semibold text-foreground">Key</TableHead>
              <TableHead className="font-semibold text-foreground">Title</TableHead>
              <TableHead className="w-32 font-semibold text-foreground">Status</TableHead>
              <TableHead className="w-24 font-semibold text-foreground">Priority</TableHead>
              <TableHead className="w-32 font-semibold text-foreground">Assignee</TableHead>
              <TableHead className="w-28 font-semibold text-foreground">Due Date</TableHead>
              <TableHead className="w-24 font-semibold text-foreground">Entity</TableHead>
              <TableHead className="w-24 font-semibold text-foreground">Sprint</TableHead>
              <TableHead className="w-32 font-semibold text-foreground">Labels</TableHead>
              <TableHead className="w-16 font-semibold text-foreground text-center">💬</TableHead>
              <TableHead className="w-28 font-semibold text-foreground">Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const status = statusConfig[task.status as keyof typeof statusConfig];
              const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
              
              return (
                <TableRow
                  key={task.id}
                  className={`cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/50 ${
                    compact ? "h-9" : "h-12"
                  }`}
                  onClick={() => handleRowClick(task.id)}
                >
                  <TableCell className="text-xs">📝</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {task.jira_key || `T-${task.id.slice(0, 4)}`}
                  </TableCell>
                  <TableCell className="font-medium text-sm max-w-xs truncate">
                    {task.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${status?.color}`}>
                      {status?.emoji} {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${priority?.color}`}>
                      {priority?.emoji} {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate max-w-[80px]">
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {task.due_at ? format(new Date(task.due_at), "MMM dd") : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {task.entity || "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {task.sprint || "-"}
                  </TableCell>
                  <TableCell>
                    {task.labels && task.labels.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {task.labels.slice(0, 2).map((label: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs py-0 px-1.5">
                            {label}
                          </Badge>
                        ))}
                        {task.labels.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{task.labels.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {task.comments_count > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {task.comments_count}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(task.created_at), "MMM dd")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleDelete(task.id, e)}>
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
