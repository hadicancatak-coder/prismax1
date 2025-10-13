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
import { toast } from "@/hooks/use-toast";

export default function Tasks() {
  const { user, userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [showFilters, setShowFilters] = useState(false);
  const [tasks, setTasks] = useState<{
    all: any[];
    yesterday: any[];
    today: any[];
    tomorrow: any[];
    thisWeek: any[];
    nextWeek: any[];
    thisMonth: any[];
    nextMonth: any[];
    past: any[];
    backlog: any[];
  }>({
    all: [],
    yesterday: [],
    today: [],
    tomorrow: [],
    thisWeek: [],
    nextWeek: [],
    thisMonth: [],
    nextMonth: [],
    past: [],
    backlog: [],
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
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekStart = new Date(today);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const nextWeekEnd = new Date(weekEnd);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
    
    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    
    const nextMonthEnd = new Date(monthEnd);
    nextMonthEnd.setMonth(nextMonthEnd.getMonth() + 1);

    // Base query - hide delete-requested tasks from members
    const baseQuery = supabase.from("tasks").select("*");
    
    // Sort: recurring tasks first (by priority High), then by priority, then by date
    const { data: allTasks } = await baseQuery
      .is("delete_requested_by", null)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    const { data: yesterdayTasks } = await supabase
      .from("tasks")
      .select("*")
      .is("delete_requested_by", null)
      .gte("due_at", yesterday.toISOString())
      .lt("due_at", today.toISOString())
      .order("due_at");

    const { data: todayTasks } = await supabase
      .from("tasks")
      .select("*")
      .is("delete_requested_by", null)
      .gte("due_at", today.toISOString())
      .lt("due_at", tomorrow.toISOString())
      .order("due_at");

    const { data: tomorrowTasks } = await supabase
      .from("tasks")
      .select("*")
      .is("delete_requested_by", null)
      .gte("due_at", tomorrow.toISOString())
      .lt("due_at", weekStart.toISOString())
      .order("due_at");

    const { data: thisWeekTasks } = await supabase
      .from("tasks")
      .select("*")
      .is("delete_requested_by", null)
      .gte("due_at", today.toISOString())
      .lt("due_at", weekEnd.toISOString())
      .order("due_at");

    const { data: nextWeekTasks } = await supabase
      .from("tasks")
      .select("*")
      .is("delete_requested_by", null)
      .gte("due_at", weekEnd.toISOString())
      .lt("due_at", nextWeekEnd.toISOString())
      .order("due_at");

    const { data: thisMonthTasks } = await supabase
      .from("tasks")
      .select("*")
      .is("delete_requested_by", null)
      .gte("due_at", today.toISOString())
      .lt("due_at", monthEnd.toISOString())
      .order("due_at");

    const { data: nextMonthTasks } = await supabase
      .from("tasks")
      .select("*")
      .is("delete_requested_by", null)
      .gte("due_at", monthEnd.toISOString())
      .lt("due_at", nextMonthEnd.toISOString())
      .order("due_at");

    const { data: pastTasks } = await supabase
      .from("tasks")
      .select("*")
      .is("delete_requested_by", null)
      .eq("status", "Completed")
      .order("updated_at", { ascending: false });

    // Backlog - only for admins (tasks with delete requests)
    const { data: backlogTasks } = await supabase
      .from("tasks")
      .select("*")
      .not("delete_requested_by", "is", null)
      .order("delete_requested_at", { ascending: false });

    // Fetch profiles separately
    const allUserIds = new Set<string>();
    [...(allTasks || []), ...(yesterdayTasks || []), ...(todayTasks || []), ...(tomorrowTasks || []), 
     ...(thisWeekTasks || []), ...(nextWeekTasks || []), ...(thisMonthTasks || []), 
     ...(nextMonthTasks || []), ...(pastTasks || []), ...(backlogTasks || [])].forEach(task => {
      if (task.created_by) allUserIds.add(task.created_by);
      if (task.assignee_id) allUserIds.add(task.assignee_id);
      if (task.delete_requested_by) allUserIds.add(task.delete_requested_by);
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
      assignee_name: profileMap.get(task.assignee_id),
      delete_requester_name: profileMap.get(task.delete_requested_by),
      entity: task.entity,
      recurrence: task.recurrence_rrule ? (task.recurrence_rrule.includes('DAILY') ? 'daily' : task.recurrence_rrule.includes('WEEKLY') ? 'weekly' : task.recurrence_rrule.includes('MONTHLY') ? 'monthly' : 'none') : 'none'
    });

    setTasks({
      all: allTasks?.map(enrichTask) || [],
      yesterday: yesterdayTasks?.map(enrichTask) || [],
      today: todayTasks?.map(enrichTask) || [],
      tomorrow: tomorrowTasks?.map(enrichTask) || [],
      thisWeek: thisWeekTasks?.map(enrichTask) || [],
      nextWeek: nextWeekTasks?.map(enrichTask) || [],
      thisMonth: thisMonthTasks?.map(enrichTask) || [],
      nextMonth: nextMonthTasks?.map(enrichTask) || [],
      past: pastTasks?.map(enrichTask) || [],
      backlog: backlogTasks?.map(enrichTask) || [],
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
    yesterday: applyFilters(tasks.yesterday),
    today: applyFilters(tasks.today),
    tomorrow: applyFilters(tasks.tomorrow),
    thisWeek: applyFilters(tasks.thisWeek),
    nextWeek: applyFilters(tasks.nextWeek),
    thisMonth: applyFilters(tasks.thisMonth),
    nextMonth: applyFilters(tasks.nextMonth),
    past: applyFilters(tasks.past),
    backlog: applyFilters(tasks.backlog),
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
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
          <TabsTrigger value="thisWeek">This Week</TabsTrigger>
          <TabsTrigger value="nextWeek">Next Week</TabsTrigger>
          <TabsTrigger value="thisMonth">This Month</TabsTrigger>
          <TabsTrigger value="nextMonth">Next Month</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          {userRole === "admin" && <TabsTrigger value="backlog">Backlog</TabsTrigger>}
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
                  entity: task.entity,
                  recurrence: task.recurrence,
                }}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No tasks due today</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="yesterday" className="mt-6 space-y-4">
          {filteredTasks.yesterday.length > 0 ? (
            filteredTasks.yesterday.map((task) => (
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
                  entity: task.entity,
                  recurrence: task.recurrence,
                }}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No tasks from yesterday</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tomorrow" className="mt-6 space-y-4">
          {filteredTasks.tomorrow.length > 0 ? (
            filteredTasks.tomorrow.map((task) => (
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
              <p className="text-muted-foreground">No tasks for tomorrow</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="thisWeek" className="mt-6 space-y-4">
          {filteredTasks.thisWeek.length > 0 ? (
            filteredTasks.thisWeek.map((task) => (
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

        <TabsContent value="nextWeek" className="mt-6 space-y-4">
          {filteredTasks.nextWeek.length > 0 ? (
            filteredTasks.nextWeek.map((task) => (
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
              <p className="text-muted-foreground">No tasks for next week</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="thisMonth" className="mt-6 space-y-4">
          {filteredTasks.thisMonth.length > 0 ? (
            filteredTasks.thisMonth.map((task) => (
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
              <p className="text-muted-foreground">No tasks for this month</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="nextMonth" className="mt-6 space-y-4">
          {filteredTasks.nextMonth.length > 0 ? (
            filteredTasks.nextMonth.map((task) => (
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
              <p className="text-muted-foreground">No tasks for next month</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-4">
          {filteredTasks.past.length > 0 ? (
            filteredTasks.past.map((task) => (
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

        <TabsContent value="backlog" className="mt-6 space-y-4">
          {userRole === "admin" ? (
            filteredTasks.backlog.length > 0 ? (
              filteredTasks.backlog.map((task) => (
                <Card key={task.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      <p className="text-xs text-warning mt-2">
                        Delete requested by {task.delete_requester_name} on{" "}
                        {new Date(task.delete_requested_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const { error } = await supabase
                            .from("tasks")
                            .update({ delete_requested_by: null, delete_requested_at: null })
                            .eq("id", task.id);
                          if (!error) {
                            toast({ title: "Request rejected" });
                            fetchTasks();
                          }
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          const { error } = await supabase.from("tasks").delete().eq("id", task.id);
                          if (!error) {
                            toast({ title: "Task deleted" });
                            fetchTasks();
                          }
                        }}
                      >
                        Approve Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No pending delete requests</p>
              </Card>
            )
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Admin access required</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
