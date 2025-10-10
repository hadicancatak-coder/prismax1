import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Search, Filter, CalendarIcon } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export default function Tasks() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [showFilters, setShowFilters] = useState(false);
  const [tasks, setTasks] = useState<{
    all: any[];
    today: any[];
    weekly: any[];
    monthly: any[];
  }>({
    all: [],
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
          console.log("Task changed, refetching...");
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

    const { data: allTasks } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: todayTasks } = await supabase
      .from("tasks")
      .select("*")
      .gte("due_at", today.toISOString())
      .lt("due_at", tomorrow.toISOString())
      .order("due_at");

    const { data: weeklyTasks } = await supabase
      .from("tasks")
      .select("*")
      .gte("due_at", tomorrow.toISOString())
      .lt("due_at", nextWeek.toISOString())
      .order("due_at");

    const { data: monthlyTasks } = await supabase
      .from("tasks")
      .select("*")
      .gte("due_at", nextWeek.toISOString())
      .lt("due_at", nextMonth.toISOString())
      .order("due_at");

    // Fetch profiles separately
    const allUserIds = new Set<string>();
    [...(allTasks || []), ...(todayTasks || []), ...(weeklyTasks || []), ...(monthlyTasks || [])].forEach(task => {
      if (task.created_by) allUserIds.add(task.created_by);
      if (task.assignee_id) allUserIds.add(task.assignee_id);
    });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name")
      .in("user_id", Array.from(allUserIds));

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

    // Attach profile names to tasks
    const enrichTask = (task: any) => ({
      ...task,
      creator_name: profileMap.get(task.created_by),
      assignee_name: profileMap.get(task.assignee_id)
    });

    setTasks({
      all: allTasks?.map(enrichTask) || [],
      today: todayTasks?.map(enrichTask) || [],
      weekly: weeklyTasks?.map(enrichTask) || [],
      monthly: monthlyTasks?.map(enrichTask) || [],
    });
  };

  const applyFilters = (taskList: any[]) => {
    return taskList.filter((task) => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      
      let matchesDateRange = true;
      if (startDate && task.due_at) {
        matchesDateRange = new Date(task.due_at) >= startDate;
      }
      if (endDate && task.due_at) {
        matchesDateRange = matchesDateRange && new Date(task.due_at) <= endDate;
      }
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  };

  const filteredTasks = {
    all: applyFilters(tasks.all),
    today: applyFilters(tasks.today),
    weekly: applyFilters(tasks.weekly),
    monthly: applyFilters(tasks.monthly),
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Tasks</h1>
          <p className="text-muted-foreground">Manage and track your team's tasks</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-gradient-primary hover:shadow-glow transition-all">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <Card className="p-4 space-y-4">
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
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
          <TabsTrigger value="blockers">Blockers</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-4">
          {filteredTasks.all.length > 0 ? (
            filteredTasks.all.map((task) => (
              <TaskCard
                key={task.id}
                task={{
                  id: task.id,
                  title: task.title,
                  description: task.description || "",
                  assignee: task.assignee_name || "Unassigned",
                  status: task.status,
                  priority: task.priority,
                  dueDate: task.due_at,
                  timeTracked: "0h 00m",
                }}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No tasks found</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="today" className="mt-6 space-y-4">
          {filteredTasks.today.length > 0 ? (
            filteredTasks.today.map((task) => (
              <TaskCard
                key={task.id}
                task={{
                  id: task.id,
                  title: task.title,
                  description: task.description || "",
                  assignee: task.assignee_name || "Unassigned",
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
                  assignee: task.assignee_name || "Unassigned",
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

        <TabsContent value="blockers" className="mt-6">
          <Card className="p-6">
            <p className="text-center text-muted-foreground">Blockers management coming soon</p>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <Card className="p-6">
            <p className="text-center text-muted-foreground">Projects management coming soon</p>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
