import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, MoreVertical, MessageCircle, Trash2 } from "lucide-react";
import { TaskDialog } from "./TaskDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: string;
  priority: string;
  dueDate: string;
  timeTracked: string;
  entity?: string | string[];
  recurrence?: string;
}

export const TaskCard = ({ task }: { task: Task }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { user, userRole } = useAuth();

  const handleDelete = async () => {
    if (userRole === "admin") {
      // Admins can delete directly
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Task deleted" });
      }
    } else {
      // Members request deletion
      const { error } = await supabase
        .from("tasks")
        .update({ 
          delete_requested_by: user?.id,
          delete_requested_at: new Date().toISOString()
        })
        .eq("id", task.id);
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Delete Requested", description: "Task moved to backlog for admin approval" });
      }
    }
    setDeleteDialogOpen(false);
  };
  
  const getPriorityBorderClass = () => {
    if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Completed") {
      return "border-l-4 border-l-destructive";
    }
    switch (task.priority) {
      case "High":
        return "border-l-4 border-l-destructive";
      case "Medium":
        return "border-l-4 border-l-warning";
      case "Low":
        return "border-l-4 border-l-success";
      default:
        return "border-l-4 border-l-muted";
    }
  };

  const statusColors = {
    "Ongoing": "bg-primary/15 text-primary border-primary/30",
    "Pending": "bg-pending/15 text-pending border-pending/30",
    "Blocked": "bg-destructive/15 text-destructive border-destructive/30",
    "Completed": "bg-success/15 text-success border-success/30",
    "Failed": "bg-muted/15 text-muted-foreground border-muted/30",
  };

  const priorityColors = {
    High: "bg-destructive/15 text-destructive border-destructive/30",
    Medium: "bg-warning/15 text-warning border-warning/30",
    Low: "bg-success/15 text-success border-success/30",
  };

  return (
    <>
      <Card className={cn("p-5 transition-smooth hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group", getPriorityBorderClass())} onClick={() => setDialogOpen(true)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1.5 truncate group-hover:text-primary transition-colors">{task.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{task.description}</p>
          </div>
          <div className="flex gap-1 ml-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}>
              <MessageCircle className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {userRole === "admin" ? "Delete Task" : "Request Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge
          variant="outline"
          className={cn(
            "text-sm px-3.5 py-1.5 font-semibold",
            statusColors[task.status as keyof typeof statusColors] || "bg-muted/15 text-muted-foreground border-muted/30"
          )}
        >
          {task.status}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "text-sm px-3.5 py-1.5 font-semibold",
            priorityColors[task.priority as keyof typeof priorityColors]
          )}
        >
          {task.priority}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{task.assignee || "Unassigned"}</span>
          </div>
          {task.entity && (
            <>
              {Array.isArray(task.entity) ? (
                <>
                  {task.entity.slice(0, 2).map((e: string) => (
                    <Badge key={e} variant="secondary" className="text-xs h-6 px-2">
                      {e}
                    </Badge>
                  ))}
                  {task.entity.length > 2 && (
                    <Badge variant="secondary" className="text-xs h-6 px-2">
                      +{task.entity.length - 2}
                    </Badge>
                  )}
                </>
              ) : (
                <Badge variant="secondary" className="text-xs h-6 px-2">
                  {task.entity}
                </Badge>
              )}
            </>
          )}
          {task.recurrence && task.recurrence !== "none" && (
            <Badge variant="secondary" className="text-xs h-6 px-2">
              {task.recurrence}
            </Badge>
          )}
        </div>
        {task.dueDate && <span className="font-medium">Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
      </div>
    </Card>
    
    <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} taskId={task.id.toString()} />
    
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {userRole === "admin" ? "Delete Task?" : "Request Task Deletion?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {userRole === "admin" 
              ? "This will permanently delete the task. This action cannot be undone."
              : "This will move the task to backlog for admin approval. You won't see it until the admin makes a decision."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            {userRole === "admin" ? "Delete" : "Request Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
