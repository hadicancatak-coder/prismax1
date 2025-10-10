import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, MoreVertical } from "lucide-react";
import { TaskDialog } from "./TaskDialog";

interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
  status: string;
  priority: string;
  dueDate: string;
  timeTracked: string;
}

export const TaskCard = ({ task }: { task: Task }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
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
      <Card className="p-6 transition-all hover:shadow-medium cursor-pointer" onClick={() => setDialogOpen(true)}>
        <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">{task.title}</h3>
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Badge
          variant="outline"
          className={statusColors[task.status as keyof typeof statusColors]}
        >
          {task.status}
        </Badge>
        <Badge
          variant="outline"
          className={priorityColors[task.priority as keyof typeof priorityColors]}
        >
          {task.priority}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{task.assignee}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{task.timeTracked}</span>
          </div>
        </div>
        <span className="font-medium">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
      </div>
    </Card>
    <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} taskId={task.id.toString()} />
    </>
  );
};
