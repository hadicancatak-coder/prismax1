import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { useEffect, useState } from "react";
import { getUpcomingTasks } from "@/lib/dashboardQueries";

export function WhatsNext() {
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchUpcomingTasks();
  }, []);

  const fetchUpcomingTasks = async () => {
    const data = await getUpcomingTasks(5);
    setUpcomingTasks(data);
  };

  const getDateLabel = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    if (isThisWeek(d)) return format(d, "EEEE");
    return format(d, "MMM d");
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">What's Next</h2>
      <div className="space-y-3">
        {upcomingTasks.length > 0 ? (
          upcomingTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-all"
            >
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm mb-1">{task.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {task.assignee?.name || "Unassigned"}
                </p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {task.due_at ? getDateLabel(task.due_at) : "No date"}
              </Badge>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming tasks</p>
        )}
      </div>
    </Card>
  );
}
