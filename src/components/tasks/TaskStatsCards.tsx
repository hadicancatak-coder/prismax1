import { Card } from "@/components/ui/card";
import { ListTodo, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

interface TaskStatsCardsProps {
  totalTasks: number;
  overdueCount: number;
  ongoingCount: number;
  completedCount: number;
}

export const TaskStatsCards = ({ totalTasks, overdueCount, ongoingCount, completedCount }: TaskStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
            <h3 className="text-2xl font-bold">{totalTasks}</h3>
          </div>
          <ListTodo className="h-8 w-8 text-primary" />
        </div>
      </Card>
      
      <Card className="p-4 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Overdue</p>
            <h3 className="text-2xl font-bold text-destructive">{overdueCount}</h3>
          </div>
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
      </Card>
      
      <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">In Progress</p>
            <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">{ongoingCount}</h3>
          </div>
          <Clock className="h-8 w-8 text-purple-500" />
        </div>
      </Card>
      
      <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</h3>
          </div>
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
      </Card>
    </div>
  );
};
