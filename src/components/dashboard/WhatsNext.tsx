import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { useEffect, useState } from "react";
import { getUpcomingTasks } from "@/lib/dashboardQueries";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function WhatsNext() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchUpcomingTasks();
    }
  }, [user?.id]);

  const fetchUpcomingTasks = async () => {
    if (!user?.id) return;
    const data = await getUpcomingTasks(user.id, 5);
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
      <ScrollArea className="max-h-[400px] pr-4">
        <div className="space-y-3">
          {upcomingTasks.length > 0 ? (
            upcomingTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate('/tasks')}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-all cursor-pointer"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground text-sm mb-1">{task.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {task.assignees && task.assignees.length > 0 
                      ? task.assignees.map((a: any) => a.name).join(", ")
                      : "Unassigned"}
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
      </ScrollArea>
    </Card>
  );
}
