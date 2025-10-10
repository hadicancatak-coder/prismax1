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

interface Task {
  id: string;
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
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}>
              <MessageCircle className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
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
