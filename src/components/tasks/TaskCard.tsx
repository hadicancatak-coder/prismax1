import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: any;
  onClick: () => void;
}

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'hsl(var(--destructive))';
      case 'Medium': return 'hsl(45 93% 47%)';
      case 'Low': return 'hsl(142 71% 45%)';
      default: return 'hsl(var(--muted))';
    }
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

  return (
    <Card 
      className="p-5 cursor-pointer hover:shadow-lg transition-shadow duration-200 border-l-4"
      style={{ borderLeftColor: getPriorityColor(task.priority) }}
      onClick={onClick}
    >
      {/* Priority and Status badges */}
      <div className="flex items-start justify-between mb-3">
        <Badge variant="outline" className={priorityColors[task.priority as keyof typeof priorityColors]}>
          {task.priority}
        </Badge>
        <Badge variant="outline" className={statusColors[task.status as keyof typeof statusColors]}>
          {task.status}
        </Badge>
      </div>
      
      {/* Task title */}
      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
        {task.title}
      </h3>
      
      {/* Task description */}
      {task.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {task.description}
        </p>
      )}
      
      {/* Footer with metadata */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="flex items-center -space-x-2">
          {task.assignees?.slice(0, 3).map((assignee: any) => (
            <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
              <AvatarImage src={assignee.avatar_url} />
              <AvatarFallback className="text-xs">{assignee.name?.[0]}</AvatarFallback>
            </Avatar>
          ))}
          {task.assignees?.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
              <span className="text-[10px] font-medium">+{task.assignees.length - 3}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.comments_count > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.comments_count}
            </div>
          )}
          {task.due_at && (
            <div className={cn(
              "flex items-center gap-1",
              isOverdue(task.due_at, task.status) && "text-destructive font-medium"
            )}>
              <Calendar className="h-3 w-3" />
              {format(new Date(task.due_at), 'MMM d')}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
