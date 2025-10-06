import { Card } from "@/components/ui/card";
import { CheckSquare, Clock, AlertCircle, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Active Tasks",
      value: "24",
      icon: CheckSquare,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "In Progress",
      value: "8",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Pending Approval",
      value: "3",
      icon: AlertCircle,
      color: "text-pending",
      bgColor: "bg-pending/10",
    },
    {
      title: "Completed",
      value: "156",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  const recentTasks = [
    {
      id: 1,
      title: "Update website homepage",
      assignee: "Sarah Chen",
      status: "In Progress",
      priority: "High",
      dueDate: "Today",
    },
    {
      id: 2,
      title: "Review Q4 budget proposal",
      assignee: "Mike Johnson",
      status: "Pending Approval",
      priority: "High",
      dueDate: "Tomorrow",
    },
    {
      id: 3,
      title: "Design new feature mockups",
      assignee: "Emma Davis",
      status: "In Progress",
      priority: "Medium",
      dueDate: "Dec 28",
    },
    {
      id: 4,
      title: "Update documentation",
      assignee: "Alex Kim",
      status: "To Do",
      priority: "Low",
      dueDate: "Dec 30",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your team's progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6 transition-all hover:shadow-medium">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Tasks</h2>
        <div className="space-y-3">
          {recentTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-all"
            >
              <div className="flex-1">
                <h3 className="font-medium text-foreground mb-1">{task.title}</h3>
                <p className="text-sm text-muted-foreground">Assigned to {task.assignee}</p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.status === "In Progress"
                      ? "bg-warning/10 text-warning"
                      : task.status === "Pending Approval"
                      ? "bg-pending/10 text-pending"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {task.status}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.priority === "High"
                      ? "bg-destructive/10 text-destructive"
                      : task.priority === "Medium"
                      ? "bg-warning/10 text-warning"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {task.priority}
                </span>
                <span className="text-sm text-muted-foreground min-w-[80px] text-right">
                  {task.dueDate}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
