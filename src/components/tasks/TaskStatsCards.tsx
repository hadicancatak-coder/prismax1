import { Card } from "@/components/ui/card";
import { ListTodo, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

interface TaskStatsCardsProps {
  totalTasks: number;
  overdueCount: number;
  ongoingCount: number;
  completedCount: number;
  onCardClick: (type: 'all' | 'overdue' | 'ongoing' | 'completed') => void;
}

export const TaskStatsCards = ({ 
  totalTasks, 
  overdueCount, 
  ongoingCount, 
  completedCount,
  onCardClick 
}: TaskStatsCardsProps) => {
  return (
    <div className="flex items-center gap-8 py-6 border-b border-border">
      <div 
        className="flex-1 cursor-pointer transition-smooth hover:scale-[1.02] hover:bg-muted/30 p-3 rounded-lg"
        onClick={() => onCardClick('all')}
      >
        <div className="text-metadata mb-1">Total Tasks</div>
        <div className="text-4xl font-semibold text-foreground">{totalTasks}</div>
      </div>
      <div className="w-px h-12 bg-border" />
      <div 
        className="flex-1 cursor-pointer transition-smooth hover:scale-[1.02] hover:bg-muted/30 p-3 rounded-lg"
        onClick={() => onCardClick('overdue')}
      >
        <div className="text-metadata mb-1">Overdue</div>
        <div className="text-4xl font-semibold text-destructive">{overdueCount}</div>
      </div>
      <div className="w-px h-12 bg-border" />
      <div 
        className="flex-1 cursor-pointer transition-smooth hover:scale-[1.02] hover:bg-muted/30 p-3 rounded-lg"
        onClick={() => onCardClick('ongoing')}
      >
        <div className="text-metadata mb-1">In Progress</div>
        <div className="text-4xl font-semibold text-foreground">{ongoingCount}</div>
      </div>
      <div className="w-px h-12 bg-border" />
      <div 
        className="flex-1 cursor-pointer transition-smooth hover:scale-[1.02] hover:bg-muted/30 p-3 rounded-lg"
        onClick={() => onCardClick('completed')}
      >
        <div className="text-metadata mb-1">Completed</div>
        <div className="text-4xl font-semibold text-foreground">{completedCount}</div>
      </div>
    </div>
  );
};
