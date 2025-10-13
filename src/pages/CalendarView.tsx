import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskDialog } from "@/components/TaskDialog";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('tasks-calendar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .not("due_at", "is", null)
      .order("due_at", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setTasks(data || []);
    }
  };

  const moveTask = async (taskId: string, newDate: Date) => {
    const { error } = await supabase
      .from("tasks")
      .update({ due_at: newDate.toISOString() })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Task moved" });
      await fetchTasks();
    }
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => task.due_at && isSameDay(parseISO(task.due_at), date));
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (view === "daily") {
      setCurrentDate(addDays(currentDate, direction === "next" ? 1 : -1));
    } else if (view === "weekly") {
      setCurrentDate(addDays(currentDate, direction === "next" ? 7 : -7));
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
      setCurrentDate(newDate);
    }
  };

  const renderDailyView = () => {
    const dayTasks = getTasksForDate(currentDate);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{format(currentDate, "EEEE, MMMM dd, yyyy")}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">{dayTasks.length} Tasks</h3>
          <div className="space-y-2">
            {dayTasks.length > 0 ? (
              dayTasks.map(task => (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setTaskDialogOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"}>
                        {task.priority}
                      </Badge>
                      <Badge variant="outline">{task.status}</Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No tasks for this day</p>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderWeeklyView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {format(weekStart, "MMM dd")} - {format(weekEnd, "MMM dd, yyyy")}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>This Week</Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-4">
          {days.map(day => {
            const dayTasks = getTasksForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <Card key={day.toISOString()} className={`p-4 ${isToday ? "ring-2 ring-primary" : ""}`}>
                <div className="mb-3">
                  <div className="font-semibold">{format(day, "EEE")}</div>
                  <div className="text-2xl font-bold">{format(day, "dd")}</div>
                </div>
                <div className="space-y-2">
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const taskId = e.dataTransfer.getData("taskId");
                        if (taskId !== task.id) moveTask(taskId, day);
                      }}
                      className="p-2 bg-muted rounded text-xs cursor-move hover:bg-muted/70 transition-colors"
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setTaskDialogOpen(true);
                      }}
                    >
                      <div className="font-medium truncate">{task.title}</div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const taskId = e.dataTransfer.getData("taskId");
                      moveTask(taskId, day);
                    }}
                    className="h-8 border-2 border-dashed border-transparent hover:border-muted-foreground/20 rounded transition-colors"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthlyView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>This Month</Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
              {day}
            </div>
          ))}
          {days.map(day => {
            const dayTasks = getTasksForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = isSameDay(day, new Date());

            return (
              <Card
                key={day.toISOString()}
                className={`p-2 min-h-[100px] cursor-pointer transition-all ${!isCurrentMonth ? "opacity-40" : ""} ${isToday ? "ring-2 ring-primary" : ""} ${selectedDate && isSameDay(day, selectedDate) ? "ring-2 ring-accent" : ""} hover:shadow-md`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="text-sm font-semibold mb-1">{format(day, "d")}</div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map(task => (
                    <div
                      key={task.id}
                      className="text-xs p-1 bg-muted rounded truncate hover:bg-muted/70"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTaskId(task.id);
                        setTaskDialogOpen(true);
                      }}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-muted-foreground">+{dayTasks.length - 2} more</div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "daily" && renderDailyView()}
      {view === "weekly" && renderWeeklyView()}
      {view === "monthly" && renderMonthlyView()}

      {selectedDate && view === "monthly" && (
        <Card className="p-6 mt-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Tasks for {format(selectedDate, "EEEE, MMMM dd, yyyy")}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
              Close
            </Button>
          </div>
          <div className="space-y-2">
            {getTasksForDate(selectedDate).length > 0 ? (
              getTasksForDate(selectedDate).map(task => (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between"
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setTaskDialogOpen(true);
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {task.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        task.status === "In Progress"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : task.status === "Completed"
                          ? "bg-success/10 text-success border-success/20"
                          : task.status === "Blocked"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {task.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        task.priority === "High"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : task.priority === "Medium"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No tasks scheduled for this date
              </div>
            )}
          </div>
        </Card>
      )}

      {selectedTaskId && (
        <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} taskId={selectedTaskId} />
      )}
    </div>
  );
}