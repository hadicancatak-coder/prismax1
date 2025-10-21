import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowRight } from "lucide-react";

interface WhatsNextCardProps {
  task: any | null;
  onStartTask: (taskId: string) => void;
}

export const WhatsNextCard = ({ task, onStartTask }: WhatsNextCardProps) => {
  if (!task) {
    return (
      <Card className="p-6 mb-6 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border-blue-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-5 w-5 text-blue-500" />
          <h3 className="font-bold">💡 What's Next</h3>
        </div>
        <p className="text-muted-foreground">
          All caught up! Great job staying on top of your tasks. 🎉
        </p>
      </Card>
    );
  }

  const priorityColors = {
    High: "bg-destructive text-destructive-foreground",
    Medium: "bg-yellow-500 text-white",
    Low: "bg-blue-500 text-white"
  };

  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border-blue-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-5 w-5 text-blue-500" />
        <h3 className="font-bold">💡 What's Next</h3>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-lg">{task.title}</h4>
            <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
              {task.priority}
            </Badge>
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {task.description}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Recommended because: {task.due_at ? 'Due soon' : 'High priority'}
          </p>
        </div>

        <Button onClick={() => onStartTask(task.id)} className="flex-shrink-0">
          Start Task
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
};
