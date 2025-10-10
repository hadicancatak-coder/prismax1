import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { TaskDialog } from "./TaskDialog";

interface TaskListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: any[];
  title: string;
}

export function TaskListDialog({ open, onOpenChange, tasks, title }: TaskListDialogProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const statusColors = {
    "In Progress": "bg-warning/10 text-warning border-warning/20",
    "Pending Approval": "bg-pending/10 text-pending border-pending/20",
    "To Do": "bg-muted text-muted-foreground border-border",
    Completed: "bg-success/10 text-success border-success/20",
  };

  const priorityColors = {
    High: "bg-destructive/10 text-destructive border-destructive/20",
    Medium: "bg-warning/10 text-warning border-warning/20",
    Low: "bg-muted text-muted-foreground border-border",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{title} ({tasks.length})</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedTaskId(task.id);
                  setTaskDialogOpen(true);
                }}
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">{task.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{task.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Badge
                    variant="outline"
                    className={statusColors[task.status as keyof typeof statusColors] || "bg-muted"}
                  >
                    {task.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={priorityColors[task.priority as keyof typeof priorityColors] || "bg-muted"}
                  >
                    {task.priority}
                  </Badge>
                  <span className="text-sm text-muted-foreground min-w-[100px] text-right">
                    {task.due_at ? new Date(task.due_at).toLocaleDateString() : "No due date"}
                  </span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No tasks found
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedTaskId && (
        <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} taskId={selectedTaskId} />
      )}
    </>
  );
}
