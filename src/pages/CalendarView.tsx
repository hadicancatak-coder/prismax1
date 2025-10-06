import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalendarView() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const tasksForDay = [
    {
      id: 1,
      title: "Update website homepage",
      time: "10:00 AM",
      priority: "High",
      status: "In Progress",
    },
    {
      id: 2,
      title: "Review Q4 budget proposal",
      time: "2:00 PM",
      priority: "High",
      status: "Pending Approval",
    },
    {
      id: 3,
      title: "Team standup meeting",
      time: "9:00 AM",
      priority: "Medium",
      status: "To Do",
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
        <p className="text-muted-foreground">View and manage tasks in calendar view</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              {date?.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border w-full pointer-events-auto"
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Tasks for {date?.toLocaleDateString()}
          </h2>
          <div className="space-y-3">
            {tasksForDay.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-foreground">{task.title}</h3>
                  <Badge
                    variant="outline"
                    className={
                      task.priority === "High"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-warning/10 text-warning border-warning/20"
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{task.time}</span>
                  <Badge
                    variant="outline"
                    className={
                      task.status === "In Progress"
                        ? "bg-warning/10 text-warning border-warning/20"
                        : task.status === "Pending Approval"
                        ? "bg-pending/10 text-pending border-pending/20"
                        : "bg-muted text-muted-foreground border-border"
                    }
                  >
                    {task.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
