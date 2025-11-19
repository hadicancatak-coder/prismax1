import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(id, full_name, avatar_url)
      `)
      .eq("user_id", user?.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    // Enrich notifications with comment text for comment_mention type
    const enrichedNotifications = await Promise.all(
      (data || []).map(async (notification) => {
        const payload = notification.payload_json as any;
        if (notification.type === "comment_mention" && payload?.comment_id) {
          const { data: comment } = await supabase
            .from("comments")
            .select("body")
            .eq("id", payload.comment_id)
            .single();
          
          return {
            ...notification,
            commentPreview: comment?.body?.substring(0, 60) || ""
          };
        }
        return notification;
      })
    );

    setNotifications(enrichedNotifications);
    setUnreadCount(enrichedNotifications.length);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned": return "📋";
      case "campaign_assigned": return "🚀";
      case "mention":
      case "comment_mention": return "💬";
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
    const actorName = notification.actor?.full_name || "Someone";
    
    switch (notification.type) {
      case "task_assigned":
        return (
          <div className="space-y-1">
            <div className="font-medium">{actorName} assigned you:</div>
            <div className="text-muted-foreground">{payload.task_title}</div>
          </div>
        );
      case "campaign_assigned":
        return (
          <div className="space-y-1">
            <div className="font-medium">{actorName} assigned you to campaign:</div>
            <div className="text-muted-foreground">{payload.campaign_title}</div>
          </div>
        );
      case "comment_mention":
        return (
          <div className="space-y-1">
            <div className="font-medium">{actorName} mentioned you in {payload.task_title}</div>
            {notification.commentPreview && (
              <div className="text-muted-foreground text-metadata italic">
                "{notification.commentPreview}{notification.commentPreview.length >= 60 ? '...' : ''}"
              </div>
            )}
          </div>
        );
      case "mention":
        return (
          <div className="space-y-1">
            <div className="font-medium">{actorName} mentioned you:</div>
            <div className="text-muted-foreground">{payload.task_title}</div>
          </div>
        );
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
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-md border-b border-border">
          <h3 className="text-heading-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} new</Badge>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-md text-center text-muted-foreground">
              No new notifications
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={async () => {
                    await supabase
                      .from("notifications")
                      .update({ read_at: new Date().toISOString() })
                      .eq("id", notification.id);
                    navigate("/notifications");
                  }}
                  className="w-full p-sm hover:bg-card-hover transition-colors text-left flex gap-sm items-start"
                >
                  {notification.actor ? (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={notification.actor.avatar_url} />
                      <AvatarFallback className="text-metadata">
                        {notification.actor.full_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="text-xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm">
                      {getNotificationMessage(notification)}
                    </div>
                    <div className="text-metadata text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleDateString()} at{" "}
                      {new Date(notification.created_at).toLocaleTimeString([], { 
                        hour: "2-digit", 
                        minute: "2-digit" 
                      })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-sm border-t border-border">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/notifications")}
          >
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
