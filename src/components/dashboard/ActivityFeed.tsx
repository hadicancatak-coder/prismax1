import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getRecentActivity } from "@/lib/dashboardQueries";
import { Activity } from "lucide-react";

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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-section-title text-foreground">Recent Activity</h2>
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user?.avatar_url} />
                <AvatarFallback>{activity.user?.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-body text-foreground">
                  <span className="font-medium">{activity.user?.name || "Unknown"}</span>
                  {" "}{getActionText(activity)}
                </p>
                <p className="text-metadata">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-body text-muted-foreground py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
}
