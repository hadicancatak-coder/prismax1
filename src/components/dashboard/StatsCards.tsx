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

  const getStatType = (title: string): string => {
    const mapping: Record<string, string> = {
      "Due Today": "today",
      "In Progress": "inProgress",
      "Overdue": "overdue",
    };
    return mapping[title] || "";
  };

  return (
    <div className="flex items-center gap-8 py-6 border-b border-border">
      {statsDisplay.map((stat) => {
        const statType = getStatType(stat.title);
        return (
          <div 
            key={stat.title}
            className="flex-1 cursor-pointer transition-smooth hover:opacity-80"
            onClick={() => statType && onStatClick(statType)}
          >
            <div className="text-metadata mb-1">{stat.title}</div>
            <div className="text-4xl font-semibold text-foreground tracking-tight">{stat.value}</div>
          </div>
        );
      })}
    </div>
  );
}
