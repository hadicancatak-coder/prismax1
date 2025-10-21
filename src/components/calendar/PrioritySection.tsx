import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Circle, CheckCircle, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrioritySectionProps {
  tasks: any[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

export const PrioritySection = ({ tasks, onTaskClick, onStatusChange }: PrioritySectionProps) => {
  const priorityTasks = tasks
    .filter(t => t.priority === 'High' && t.status !== 'Completed')
    .slice(0, 3);

  if (priorityTasks.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 mb-6 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-orange-500" />
        <h3 className="text-xl font-bold">🎯 Today's Top Priorities</h3>
      </div>

      <div className="space-y-3">
        {priorityTasks.map((task, index) => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-4 border-2 border-orange-500/20 rounded-lg bg-background hover:border-orange-500/40 transition-all group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 font-bold text-sm flex-shrink-0">
              {index + 1}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, task.status === 'Completed' ? 'Ongoing' : 'Completed');
              }}
            >
              {task.status === 'Completed' ? (
                <CheckCircle className="h-5 w-5 text-green-500 fill-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground group-hover:text-orange-500" />
              )}
            </Button>

            <div 
              className="flex-1 cursor-pointer"
              onClick={() => onTaskClick(task.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className={cn(
                  "font-semibold text-lg",
                  task.status === 'Completed' && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h4>
                <Badge variant="destructive" className="flex-shrink-0">
                  High Priority
                </Badge>
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                  {task.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
