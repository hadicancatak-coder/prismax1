import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";

interface DailySummaryCardProps {
  completedTasks: number;
  totalTasks: number;
  timeTracked: string;
}

export const DailySummaryCard = ({ 
  completedTasks, 
  totalTasks, 
  timeTracked 
}: DailySummaryCardProps) => {
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="p-6 mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">📊 Your Day at a Glance</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tasks</p>
              <p className="text-3xl font-bold">{completedTasks}/{totalTasks}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Time Tracked</p>
              <p className="text-3xl font-bold">{timeTracked}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-3xl font-bold">{completionPercentage}%</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-bold">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </div>
        </div>
      </div>
    </Card>
  );
};
