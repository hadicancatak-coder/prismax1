import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Tasks() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [tasks, setTasks] = useState<{
    today: any[];
    weekly: any[];
    monthly: any[];
  }>({
    today: [],
    weekly: [],
    monthly: [],
  });

  useEffect(() => {
    if (!user) return;
    fetchTasks();

    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchTasks = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const { data: todayTasks } = await supabase
      .from("tasks")
      .select(`
        *,
        profiles:created_by(name),
        assignee:assignee_id(name)
      `)
      .gte("due_at", today.toISOString())
      .lt("due_at", tomorrow.toISOString())
      .order("due_at");

    const { data: weeklyTasks } = await supabase
      .from("tasks")
      .select(`
        *,
        profiles:created_by(name),
        assignee:assignee_id(name)
      `)
      .gte("due_at", tomorrow.toISOString())
      .lt("due_at", nextWeek.toISOString())
      .order("due_at");

    const { data: monthlyTasks } = await supabase
      .from("tasks")
      .select(`
        *,
        profiles:created_by(name),
        assignee:assignee_id(name)
      `)
      .gte("due_at", nextWeek.toISOString())
      .lt("due_at", nextMonth.toISOString())
      .order("due_at");

    setTasks({
      today: todayTasks || [],
      weekly: weeklyTasks || [],
      monthly: monthlyTasks || [],
    });
  };

  const filteredTasks = {
    today: tasks.today.filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    weekly: tasks.weekly.filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    monthly: tasks.monthly.filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tasks</h1>
          <p className="text-muted-foreground">Manage and track your team's tasks</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6 space-y-4">
          {filteredTasks.today.length > 0 ? (
            filteredTasks.today.map((task) => (
              <TaskCard
                key={task.id}
                task={{
                  id: task.id,
                  title: task.title,
                  description: task.description || "",
                  assignee: task.assignee?.name || "Unassigned",
                  status: task.status,
                  priority: task.priority,
                  dueDate: task.due_at,
                  timeTracked: "0h 00m",
                }}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No tasks due today</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-6 space-y-4">
          {filteredTasks.weekly.length > 0 ? (
            filteredTasks.weekly.map((task) => (
              <TaskCard
                key={task.id}
                task={{
                  id: task.id,
                  title: task.title,
                  description: task.description || "",
                  assignee: task.assignee?.name || "Unassigned",
                  status: task.status,
                  priority: task.priority,
                  dueDate: task.due_at,
                  timeTracked: "0h 00m",
                }}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No tasks due this week</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="mt-6 space-y-4">
          {filteredTasks.monthly.length > 0 ? (
            filteredTasks.monthly.map((task) => (
              <TaskCard
                key={task.id}
                task={{
                  id: task.id,
                  title: task.title,
                  description: task.description || "",
                  assignee: task.assignee?.name || "Unassigned",
                  status: task.status,
                  priority: task.priority,
                  dueDate: task.due_at,
                  timeTracked: "0h 00m",
                }}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No tasks due this month</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
