import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel("notification-bell")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user?.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    setNotifications(data || []);
    setUnreadCount((data || []).length);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned": return "📋";
      case "campaign_assigned": return "🚀";
      case "mention": return "💬";
      case "deadline_reminder_3days": return "⏰";
      case "deadline_reminder_1day": return "🔔";
      case "deadline_reminder_overdue": return "❗";
      case "blocker_resolved": return "✅";
      case "task_status_changed": return "🔄";
      case "campaign_status_changed": return "🔄";
      case "ad_status_changed": return "📢";
      case "ad_pending_review": return "👀";
      default: return "🔔";
    }
  };

  const getNotificationMessage = (notification: any) => {
    const payload = notification.payload_json;
    switch (notification.type) {
      case "task_assigned":
        return `New task: ${payload.task_title}`;
      case "campaign_assigned":
        return `Assigned to campaign: ${payload.campaign_title}`;
      case "mention":
        return `Mentioned in "${payload.task_title}"`;
      case "task_updated":
        return payload.message || `"${payload.task_title}" updated`;
      case "deadline_reminder_3days":
        return `Task "${payload.task_title}" due in 3 days`;
      case "deadline_reminder_1day":
        return `Task "${payload.task_title}" due tomorrow!`;
      case "deadline_reminder_overdue":
        return `Task "${payload.task_title}" is ${payload.days_overdue} days overdue`;
      case "campaign_starting_soon":
        return `Campaign "${payload.campaign_title}" launches in 3 days`;
      case "task_status_changed":
        return `Task "${payload.task_title}" moved to ${payload.new_status}`;
      case "campaign_status_changed":
        return `Campaign "${payload.campaign_title}" moved to ${payload.new_status}`;
      case "blocker_resolved":
        return `Blocker resolved for "${payload.task_title}"`;
      case "approval_pending":
        return `Approval pending for "${payload.task_title}" (${payload.days_pending} days)`;
      case "ad_status_changed":
        return `Ad "${payload.ad_name}" status changed to ${payload.new_status}`;
      case "ad_pending_review":
        return `New ad "${payload.ad_name}" pending review`;
      default:
        return "New notification";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Notifications</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/notifications")}
          >
            View All
          </Button>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 bg-muted/30 rounded-lg text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={async () => {
                    await supabase
                      .from("notifications")
                      .update({ read_at: new Date().toISOString() })
                      .eq("id", notification.id);
                    navigate("/notifications");
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium mb-1 line-clamp-2">
                        {getNotificationMessage(notification)}
                      </p>
                      {notification.payload_json?.message && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                          {notification.payload_json.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No new notifications
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
