import { Card } from "@/components/ui/card";
import { Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Stat {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend?: number;
}

interface StatsCardsProps {
  stats: {
    today: number;
    overdue: number;
    inProgress: number;
    completedThisWeek: number;
  };
  onStatClick: (type: string) => void;
}

export function StatsCards({ stats, onStatClick }: StatsCardsProps) {
  const statsDisplay: Stat[] = [
    { 
      title: "Due Today", 
      value: stats.today, 
      icon: Clock, 
      color: "text-warning", 
      bgColor: "bg-warning/10"
    },
    { 
      title: "In Progress", 
      value: stats.inProgress, 
      icon: TrendingUp, 
      color: "text-primary", 
      bgColor: "bg-primary/10"
    },
    { 
      title: "Overdue", 
      value: stats.overdue, 
      icon: AlertCircle, 
      color: "text-destructive", 
      bgColor: "bg-destructive/10"
    },
    { 
      title: "Completed This Week", 
      value: stats.completedThisWeek, 
      icon: CheckCircle, 
      color: "text-success", 
      bgColor: "bg-success/10"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsDisplay.map((stat, index) => (
        <Card 
          key={stat.title} 
          className="p-6 transition-all hover:shadow-lg hover:-translate-y-1 animate-scale-in cursor-pointer group"
          style={{ animationDelay: `${index * 100}ms` }}
          onClick={() => onStatClick(stat.title.toLowerCase().replace(/ /g, '_'))}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
              <p className="text-4xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
            </div>
            <div className={`${stat.bgColor} p-4 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-200`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} strokeWidth={2.5} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
