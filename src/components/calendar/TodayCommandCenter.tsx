import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Target, Clock, CheckCircle2, Focus } from "lucide-react";
import { format } from "date-fns";

interface TodayCommandCenterProps {
  currentDate: Date;
  highPriorityCount: number;
  upcomingCount: number;
  completedToday: number;
  totalToday: number;
  onAddTask: () => void;
  onFocusMode: () => void;
}

export const TodayCommandCenter = ({ 
  currentDate,
  highPriorityCount,
  upcomingCount,
  completedToday,
  totalToday,
  onAddTask,
  onFocusMode
}: TodayCommandCenterProps) => {
  const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  return (
    <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Today's Command Center</h2>
          </div>
          <p className="text-muted-foreground">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onFocusMode}>
            <Focus className="h-4 w-4 mr-2" />
            Focus Mode
          </Button>
          <Button size="sm" onClick={onAddTask}>
            + Add Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your Focus</p>
            <p className="text-xl font-bold">{highPriorityCount} High Priority</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Clock className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Upcoming</p>
            <p className="text-xl font-bold">{upcomingCount} tasks</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-xl font-bold">{completedToday}/{totalToday}</p>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">Progress</p>
            <p className="text-sm font-bold">{completionPercentage}%</p>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </div>
    </Card>
  );
};
