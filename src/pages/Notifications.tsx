import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Check, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { TaskDialog } from "@/components/TaskDialog";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Real-time subscription
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      toast({ title: "Error", description: "Failed to load notifications", variant: "destructive" });
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) {
      toast({ title: "Error", description: "Failed to mark as read", variant: "destructive" });
    } else {
      fetchNotifications();
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete notification", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Notification deleted" });
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification: any) => {
    const payload = notification.payload_json;
    
    // Mark as read
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    
    // Open task dialog if task_id exists
    if (payload.task_id) {
      setSelectedTaskId(payload.task_id);
      setTaskDialogOpen(true);
    }
  };

  const getNotificationMessage = (notification: any) => {
    const payload = notification.payload_json;
    switch (notification.type) {
      case "task_assigned":
        return `You have been assigned a new task: ${payload.task_title}`;
      case "comment_mention":
        return `You were mentioned in "${payload.task_title}"`;
      case "task_updated":
        return payload.message || `Task "${payload.task_title}" was updated`;
      default:
        return "You have a new notification";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your tasks and mentions</p>
        </div>
        <Bell className="h-8 w-8 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 transition-all hover:shadow-medium cursor-pointer ${
                notification.read_at ? "bg-background" : "bg-muted/50 border-primary/20"
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-foreground mb-2">{getNotificationMessage(notification)}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(notification.created_at).toLocaleString()}</span>
                    {!notification.read_at && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {!notification.read_at && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(notification.id)}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Mark Read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteNotification(notification.id)}
                    className="gap-2 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        )}
      </div>

      {selectedTaskId && (
        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          taskId={selectedTaskId}
        />
      )}
    </div>
  );
}
