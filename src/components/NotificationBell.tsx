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

  const getNotificationMessage = (notification: any) => {
    const payload = notification.payload_json;
    switch (notification.type) {
      case "task_assigned":
        return `New task: ${payload.task_title}`;
      case "mention":
        return `Mentioned in "${payload.task_title}"`;
      case "task_updated":
        return payload.message || `"${payload.task_title}" updated`;
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
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-white">
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
                  <p className="text-foreground mb-1">{getNotificationMessage(notification)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
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
