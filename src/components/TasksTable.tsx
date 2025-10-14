import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
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

interface TasksTableProps {
  tasks: any[];
  onTaskUpdate: () => void;
}

export function TasksTable({ tasks, onTaskUpdate }: TasksTableProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const statusConfig = {
    "Pending": { color: "bg-muted text-muted-foreground" },
    "Ongoing": { color: "bg-warning/10 text-warning border-warning/20" },
    "Completed": { color: "bg-success/10 text-success border-success/20" },
    "Failed": { color: "bg-destructive/10 text-destructive border-destructive/20" },
    "Blocked": { color: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  const priorityConfig = {
    High: { color: "bg-destructive/10 text-destructive border-destructive/20" },
    Medium: { color: "bg-warning/10 text-warning border-warning/20" },
    Low: { color: "bg-success/10 text-success border-success/20" },
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
            {tasks.map((task) => {
              const status = statusConfig[task.status as keyof typeof statusConfig];
              const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
              
              return (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleRowClick(task.id)}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={status?.color}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priority?.color}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={task.assignee.avatar_url} />
                          <AvatarFallback>
                            {task.assignee.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee.name}</span>
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
                          <MoreHorizontal className="h-4 w-4" />
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
