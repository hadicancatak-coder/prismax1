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
    <div className="space-y-0">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
      
      {activities.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No recent activity
        </div>
      ) : (
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 py-3 hover:bg-gray-50 transition-colors">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={activity.user?.avatar_url} />
                <AvatarFallback>{activity.user?.name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user?.name || "Unknown"}</span>
                  {" "}{getActionText(activity)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
