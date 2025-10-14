import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getRecentActivity } from "@/lib/dashboardQueries";

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel('activity_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activity_logs' },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    const data = await getRecentActivity(10);
    setActivities(data);
  };

  const getActionText = (activity: any) => {
    if (activity.field_name) {
      return `${activity.action} ${activity.entity_type} ${activity.field_name}`;
    }
    return `${activity.action} ${activity.entity_type}`;
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
      <ScrollArea className="max-h-[400px] pr-4">
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.user?.avatar_url} />
                  <AvatarFallback>{activity.user?.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.user?.name || "Unknown"}</span>
                    {" "}{getActionText(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
