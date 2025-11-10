import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CompletedTasksSectionProps {
  tasks: any[];
  onTaskClick: (taskId: string) => void;
  onTaskComplete: (taskId: string, completed: boolean) => void;
}

export const CompletedTasksSection = ({
  tasks,
  onTaskClick,
  onTaskComplete,
}: CompletedTasksSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth group"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium text-muted-foreground">
          Completed Tasks
        </span>
        <Badge variant="secondary" className="ml-auto">
          {tasks.length}
        </Badge>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2 opacity-70">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 py-3 px-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-smooth cursor-pointer group"
              onClick={() => onTaskClick(task.id)}
            >
              <Checkbox
                checked={true}
                onCheckedChange={(checked) => onTaskComplete(task.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm line-through text-muted-foreground">
                    {task.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className="border-border/50 text-muted-foreground text-xs"
                  >
                    {task.priority}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {task.description.replace(/<[^>]*>/g, "").substring(0, 100)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
