import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskBoardViewProps {
  tasks: any[];
  onTaskClick: (taskId: string) => void;
}

export const TaskBoardView = ({ tasks, onTaskClick }: TaskBoardViewProps) => {
  const statuses = ['Pending', 'Ongoing', 'Blocked', 'Completed', 'Failed'];

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'Completed') return false;
    return new Date(dueDate) < new Date();
  };

  const priorityColors = {
    High: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
    Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    Low: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
  };

  const statusColors: Record<string, string> = {
    Pending: "bg-blue-500/20",
    Ongoing: "bg-purple-500/20",
    Blocked: "bg-orange-500/20",
    Completed: "bg-green-500/20",
    Failed: "bg-red-500/20",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {statuses.map(status => (
        <div key={status} className="flex flex-col min-h-[600px]">
          <div className={cn("rounded-t-lg p-3 border-b", statusColors[status])}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{status}</h3>
              <Badge variant="secondary">
                {tasks.filter(t => t.status === status).length}
              </Badge>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-2 bg-muted/20 rounded-b-lg">
            <div className="space-y-2">
              {tasks
                .filter(t => t.status === status)
                .map(task => (
                  <Card 
                    key={task.id}
                    className="p-3 cursor-pointer hover:shadow-md transition-shadow animate-fade-in"
                    onClick={() => onTaskClick(task.id)}
                  >
                    <Badge 
                      variant="outline"
                      className={cn("mb-2", priorityColors[task.priority as keyof typeof priorityColors])}
                    >
                      {task.priority}
                    </Badge>
                    <p className="font-medium mt-2 text-sm line-clamp-2">
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex -space-x-2">
                        {task.assignees?.slice(0, 3).map((assignee: any) => (
                          <Avatar key={assignee.user_id} className="h-5 w-5 border-2 border-background">
                            <AvatarImage src={assignee.avatar_url} />
                            <AvatarFallback className="text-[10px]">
                              {assignee.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {task.assignees?.length > 3 && (
                          <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-[8px] font-medium">+{task.assignees.length - 3}</span>
                          </div>
                        )}
                      </div>
                      {task.due_at && (
                        <span className={cn(
                          "text-xs",
                          isOverdue(task.due_at, task.status) && "text-destructive font-medium"
                        )}>
                          {format(new Date(task.due_at), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
};
