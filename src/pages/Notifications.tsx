import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Check, Trash2, Search, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaskDialog } from "@/components/TaskDialog";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { AnnouncementsSection } from "@/components/AnnouncementsSection";
import { NotificationDetailDialog } from "@/components/NotificationDetailDialog";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";

export default function Notifications() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  useEffect(() => {
    applyFilters();
  }, [notifications, readFilter, typeFilter, searchQuery]);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Read/unread filter
    if (readFilter === "unread") {
      filtered = filtered.filter(n => !n.read_at);
    } else if (readFilter === "read") {
      filtered = filtered.filter(n => n.read_at);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(n => {
        const message = getNotificationMessage(n).toLowerCase();
        return message.includes(searchQuery.toLowerCase());
      });
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (!error) {
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user?.id)
      .is("read_at", null);

    if (!error) {
      toast({ title: "All notifications marked as read" });
      fetchNotifications();
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (!error) {
      fetchNotifications();
    }
  };

  const deleteSelected = async () => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .in("id", selectedIds);

    if (!error) {
      toast({ title: `${selectedIds.length} notifications deleted` });
      setSelectedIds([]);
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification: any) => {
    setSelectedNotification(notification);
    setDetailDialogOpen(true);
    
    const payload = notification.payload_json;
    
    // Open task dialog if task_id exists
    if (payload.task_id) {
      setSelectedTaskId(payload.task_id);
      setTaskDialogOpen(true);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
      case "announcement":
        return `${payload.title}: ${payload.message}`;
      case "campaign_converted_to_task":
        return payload.message || `Campaign converted to task`;
      case "deadline_reminder_3days":
        return `⏰ Task "${payload.task_title}" due in 3 days`;
      case "deadline_reminder_1day":
        return `🔔 Task "${payload.task_title}" due tomorrow!`;
      case "deadline_reminder_overdue":
        return `❗ Task "${payload.task_title}" is ${payload.days_overdue} days overdue`;
      case "campaign_starting_soon":
        return `🚀 Campaign "${payload.campaign_title}" launches in 3 days`;
      case "task_status_changed":
        return `Task "${payload.task_title}" moved to ${payload.new_status}`;
      case "campaign_status_changed":
        return `Campaign "${payload.campaign_title}" moved to ${payload.new_status}`;
      case "blocker_resolved":
        return `✅ Blocker resolved for "${payload.task_title}"`;
      case "approval_pending":
        return `⏳ Approval pending for "${payload.task_title}" (${payload.days_pending} days)`;
      default:
        return "You have a new notification";
    }
  };

  const getPriorityBadge = (type: string) => {
    if (type.includes("overdue") || type.includes("blocker")) {
      return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
    }
    if (type.includes("1day") || type.includes("approval")) {
      return <Badge variant="default" className="text-xs bg-orange-500">High</Badge>;
    }
    return null;
  };

  const groupByDate = (notifs: any[]) => {
    const groups: Record<string, any[]> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Older: []
    };

    notifs.forEach(n => {
      const date = new Date(n.created_at);
      if (isToday(date)) {
        groups.Today.push(n);
      } else if (isYesterday(date)) {
        groups.Yesterday.push(n);
      } else if (isThisWeek(date, { weekStartsOn: 1 })) {
        groups["This Week"].push(n);
      } else {
        groups.Older.push(n);
      }
    });

    return groups;
  };

  const notificationTypes = Array.from(new Set(notifications.map(n => n.type)));
  const groupedNotifications = groupByDate(filteredNotifications);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-8 space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-page-title">Notifications</h1>
          <p className="text-body text-muted-foreground">
            Stay updated with your tasks, mentions, and important updates
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {notifications.filter(n => !n.read_at).length} Unread
        </Badge>
      </div>

      <AnnouncementsSection />

      {/* Filters and Actions */}
      <div className="border border-border rounded p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Tabs value={readFilter} onValueChange={(v: any) => setReadFilter(v)} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {notificationTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>

        {selectedIds.length > 0 && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-muted rounded">
            <span className="text-body">{selectedIds.length} selected</span>
            <Button onClick={deleteSelected} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
            <Button onClick={() => setSelectedIds([])} variant="ghost" size="sm">
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      {/* Grouped Notifications */}
      <div className="space-y-8">
        {Object.entries(groupedNotifications).map(([group, notifs]) => (
          notifs.length > 0 && (
            <div key={group}>
              <h2 className="text-metadata uppercase tracking-wide mb-3">{group}</h2>
              <div className="space-y-2">
                {notifs.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border border-border rounded transition-smooth hover:border-primary cursor-pointer ${
                      notification.read_at ? "bg-background" : "bg-muted/30 border-l-2 border-l-primary"
                    } ${selectedIds.includes(notification.id) ? "ring-2 ring-primary" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={selectedIds.includes(notification.id)}
                          onCheckedChange={() => toggleSelect(notification.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <p className="text-body text-foreground mb-2">{getNotificationMessage(notification)}</p>
                          <div className="flex items-center gap-3 text-metadata">
                            <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                            {!notification.read_at && (
                              <Badge variant="outline">New</Badge>
                            )}
                            {getPriorityBadge(notification.type)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {!notification.read_at && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {(userRole === "admin" || notification.user_id === user?.id) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
          ))}

          {filteredNotifications.length === 0 && !loading && (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-body text-muted-foreground">
                {searchQuery || typeFilter !== "all" || readFilter !== "all"
                  ? "No notifications match your filters"
                  : "No notifications yet"}
              </p>
            </div>
          )}
        </div>
      )}

      {selectedTaskId && (
        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          taskId={selectedTaskId}
        />
      )}

      {selectedNotification && (
        <NotificationDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          notification={selectedNotification}
          onDelete={fetchNotifications}
          onMarkRead={fetchNotifications}
        />
      )}
    </div>
  );
}
