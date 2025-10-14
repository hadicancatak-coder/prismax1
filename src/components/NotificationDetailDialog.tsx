import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Trash2, Calendar, MessageSquare, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface NotificationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: any;
  onDelete: () => void;
  onMarkRead: () => void;
}

export function NotificationDetailDialog({
  open,
  onOpenChange,
  notification,
  onDelete,
  onMarkRead,
}: NotificationDetailDialogProps) {
  const { userRole } = useAuth();

  if (!notification) return null;

  const payload = notification.payload_json || {};
  
  const getIcon = () => {
    switch (notification.type) {
      case "task_assigned":
        return <Calendar className="h-5 w-5 text-primary" />;
      case "comment_mention":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "announcement":
        return <Bell className="h-5 w-5 text-orange-500" />;
      case "blocker_created":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTitle = () => {
    switch (notification.type) {
      case "task_assigned":
        return "Task Assignment";
      case "comment_mention":
        return "Comment Mention";
      case "announcement":
        return payload.title || "Announcement";
      case "blocker_created":
        return "Blocker Created";
      case "campaign_converted_to_task":
        return "Campaign Launch";
      default:
        return "Notification";
    }
  };

  const getMessage = () => {
    switch (notification.type) {
      case "task_assigned":
        return `You have been assigned to the task: "${payload.task_title}"`;
      case "comment_mention":
        return `You were mentioned in a comment on task: "${payload.task_title}"`;
      case "announcement":
        return payload.message || "New announcement";
      case "blocker_created":
        return `A blocker was created for task: "${payload.blocker_title}"`;
      case "campaign_converted_to_task":
        return payload.message || "A campaign has been converted to a task";
      default:
        return "You have a new notification";
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notification.id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete notification", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Notification deleted" });
      onDelete();
      onOpenChange(false);
    }
  };

  const handleMarkRead = async () => {
    if (notification.read_at) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notification.id);

    if (!error) {
      onMarkRead();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-foreground">{getMessage()}</p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </div>
            {!notification.read_at && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Unread
              </Badge>
            )}
          </div>

          {payload.priority && (
            <div>
              <span className="text-xs text-muted-foreground">Priority: </span>
              <Badge className={
                payload.priority === "urgent" ? "bg-destructive" :
                payload.priority === "high" ? "bg-orange-500" :
                "bg-primary"
              }>
                {payload.priority}
              </Badge>
            </div>
          )}

          {payload.task_id && (
            <p className="text-xs text-muted-foreground">
              Task ID: {payload.task_id}
            </p>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {!notification.read_at && (
            <Button variant="outline" onClick={handleMarkRead} className="gap-2">
              <Check className="h-4 w-4" />
              Mark as Read
            </Button>
          )}
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
