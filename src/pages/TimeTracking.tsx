import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TimeTracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00:00");

  const timeEntries = [
    {
      id: 1,
      task: "Update website homepage",
      date: "2024-12-26",
      duration: "2h 30m",
      status: "Completed",
    },
    {
      id: 2,
      task: "Review Q4 budget proposal",
      date: "2024-12-26",
      duration: "1h 15m",
      status: "In Progress",
    },
    {
      id: 3,
      task: "Design new feature mockups",
      date: "2024-12-25",
      duration: "4h 00m",
      status: "Completed",
    },
    {
      id: 4,
      task: "Team standup meeting",
      date: "2024-12-25",
      duration: "0h 30m",
      status: "Completed",
    },
  ];

  const totalHoursToday = "3h 45m";
  const totalHoursWeek = "18h 30m";

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Time Tracking</h1>
        <p className="text-muted-foreground">Track time spent on tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Today</p>
          <p className="text-3xl font-bold text-foreground">{totalHoursToday}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">This Week</p>
          <p className="text-3xl font-bold text-foreground">{totalHoursWeek}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Average per Day</p>
          <p className="text-3xl font-bold text-foreground">3h 42m</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Current Timer</h2>
        <div className="space-y-4">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select a task to track" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task1">Update website homepage</SelectItem>
              <SelectItem value="task2">Review Q4 budget proposal</SelectItem>
              <SelectItem value="task3">Design new feature mockups</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center justify-between p-8 bg-muted rounded-lg">
            <div className="text-5xl font-bold text-foreground font-mono">{currentTime}</div>
            <div className="flex gap-2">
              {!isTracking ? (
                <Button
                  size="lg"
                  onClick={() => setIsTracking(true)}
                  className="gap-2"
                >
                  <Play className="h-5 w-5" />
                  Start
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setIsTracking(false)}
                    className="gap-2"
                  >
                    <Pause className="h-5 w-5" />
                    Pause
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={() => {
                      setIsTracking(false);
                      setCurrentTime("00:00:00");
                    }}
                    className="gap-2"
                  >
                    <Square className="h-5 w-5" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Time Entries</h2>
        <div className="space-y-3">
          {timeEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-all"
            >
              <div className="flex-1">
                <h3 className="font-medium text-foreground mb-1">{entry.task}</h3>
                <p className="text-sm text-muted-foreground">{entry.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-foreground">{entry.duration}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    entry.status === "Completed"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {entry.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
