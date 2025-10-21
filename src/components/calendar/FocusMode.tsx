import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusModeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any | null;
  onComplete: (taskId: string) => void;
}

export const FocusMode = ({ open, onOpenChange, task, onComplete }: FocusModeProps) => {
  if (!task) return null;

  const priorityColors = {
    High: "bg-destructive text-destructive-foreground",
    Medium: "bg-yellow-500 text-white",
    Low: "bg-blue-500 text-white"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/20">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                {task.priority} Priority
              </Badge>
              <Badge variant="outline">{task.status}</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-12">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold mb-6">{task.title}</h1>
              
              {task.description && (
                <div className="prose prose-lg dark:prose-invert mb-8">
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Task Details */}
              <div className="grid grid-cols-2 gap-6 mb-8 p-6 bg-muted/50 rounded-lg">
                {task.due_at && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                    <p className="font-medium">{new Date(task.due_at).toLocaleDateString()}</p>
                  </div>
                )}
                {task.assignees && task.assignees.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                    <p className="font-medium">{task.assignees.map((a: any) => a.name).join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-background">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Focus on this task until completion
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Exit Focus
                </Button>
                <Button 
                  onClick={() => {
                    onComplete(task.id);
                    onOpenChange(false);
                  }}
                  className="gap-2"
                >
                  {task.status === 'Completed' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Circle className="h-4 w-4" />
                      Mark Complete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
