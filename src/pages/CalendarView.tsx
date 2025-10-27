import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskDialog } from "@/components/TaskDialog";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TodayCommandCenter } from "@/components/calendar/TodayCommandCenter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format, startOfDay, endOfDay, subDays, addDays, startOfWeek, endOfWeek } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

export default function CalendarView() {
  document.title = "Agenda - Prisma";
  const { user, userRole } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dateView, setDateView] = useState<"today" | "yesterday" | "tomorrow" | "week" | "custom">("today");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const currentDate = new Date();

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
    }
    fetchTasks();
  }, [userRole, user?.id, selectedUserId, dateView, customDateRange]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, name, username");
    setUsers(data || []);
  };

  const fetchTasks = async () => {
    if (!user?.id) return;

    // Get current user's profile with teams
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, user_id, teams')
      .eq('user_id', selectedUserId || user.id)
      .single();

    let query = supabase.from("tasks").select(`
      *,
      task_assignees(user_id)
    `);

    // Calculate date range based on selected view
    let startDate: Date;
    let endDate: Date;

    switch (dateView) {
      case "yesterday":
        startDate = startOfDay(subDays(new Date(), 1));
        endDate = endOfDay(subDays(new Date(), 1));
        break;
      case "tomorrow":
        startDate = startOfDay(addDays(new Date(), 1));
        endDate = endOfDay(addDays(new Date(), 1));
        break;
      case "week":
        startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case "custom":
        if (customDateRange) {
          startDate = startOfDay(customDateRange.from);
          endDate = endOfDay(customDateRange.to);
        } else {
          startDate = startOfDay(new Date());
          endDate = endOfDay(new Date());
        }
        break;
      case "today":
      default:
        startDate = startOfDay(new Date());
        endDate = endOfDay(new Date());
        break;
    }

    query = query
      .gte("due_at", startDate.toISOString())
      .lte("due_at", endDate.toISOString())
      .order("due_at", { ascending: true });

    const { data: allTasks } = await query;

    // Filter tasks by direct assignment OR team membership
    const filteredTasks = (allTasks || []).filter((task: any) => {
      // Admin sees all tasks if no specific user selected
      if (userRole === 'admin' && !selectedUserId) {
        return true;
      }

      // Check direct assignment
      const assigneeIds = task.task_assignees?.map((a: any) => a.user_id) || [];
      const isDirectAssignee = assigneeIds.includes(currentProfile?.id);
      
      // Check team membership
      const userTeams = currentProfile?.teams || [];
      const taskTeams = Array.isArray(task.teams) 
        ? task.teams 
        : (typeof task.teams === 'string' ? JSON.parse(task.teams) : []);
      
      const isTeamMember = userTeams.some((team: string) => taskTeams.includes(team));
      
      return isDirectAssignee || isTeamMember;
    });

    setTasks(filteredTasks);
  };

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    await supabase
      .from('tasks')
      .update({ status: completed ? 'Completed' : 'Pending' })
      .eq('id', taskId);
    
    fetchTasks();
  };

  const todayTasks = tasks;
  const completedToday = tasks.filter(t => t.status === 'Completed').length;
  const totalToday = tasks.length;
  const highPriorityCount = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
  const upcomingCount = tasks.filter(t => t.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {!focusMode && (
        <>
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Agenda</h1>
            <p className="text-gray-600">{format(currentDate, 'EEEE, MMMM d, yyyy')}</p>
            
            {userRole === 'admin' && users.length > 0 && (
              <div className="mt-4 max-w-xs">
                <Select value={selectedUserId || undefined} onValueChange={(value) => setSelectedUserId(value === 'all' ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.user_id}>
                        {user.name || user.username || 'Unknown User'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <Tabs value={dateView} onValueChange={(v) => setDateView(v as any)} className="w-auto">
                <TabsList>
                  <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                  <TabsTrigger value="week">This Week</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
              </Tabs>

              {dateView === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange ? (
                        `${format(customDateRange.from, "MMM d")} - ${format(customDateRange.to, "MMM d")}`
                      ) : (
                        "Pick a date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={customDateRange ? { from: customDateRange.from, to: customDateRange.to } : undefined}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setCustomDateRange({ from: range.from, to: range.to });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </header>

          <TodayCommandCenter 
            currentDate={currentDate}
            highPriorityCount={highPriorityCount}
            upcomingCount={upcomingCount}
            completedToday={completedToday}
            totalToday={totalToday}
            onAddTask={() => setCreateTaskOpen(true)}
            onFocusMode={() => setFocusMode(true)}
          />
        </>
      )}

      {focusMode && (
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Focus Mode</h1>
          <Button onClick={() => setFocusMode(false)} variant="outline">
            Exit Focus Mode
          </Button>
        </div>
      )}

      <div className={`grid gap-6 mt-8 ${focusMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        <Card className={focusMode ? '' : 'lg:col-span-2'}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {dateView === "today" && "Today's Tasks"} 
              {dateView === "yesterday" && "Yesterday's Tasks"}
              {dateView === "tomorrow" && "Tomorrow's Tasks"}
              {dateView === "week" && "This Week's Tasks"}
              {dateView === "custom" && "Custom Range Tasks"}
              ({todayTasks.length})
            </CardTitle>
            {focusMode && (
              <Button variant="outline" size="sm" onClick={() => setFocusMode(false)}>
                Exit Focus Mode
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tasks for today</p>
              ) : (
                todayTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setTaskDialogOpen(true);
                    }}
                  >
                    <Checkbox 
                      checked={task.status === 'Completed'}
                      onCheckedChange={(checked) => handleTaskComplete(task.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </h4>
                        <Badge variant="outline" className={
                          task.priority === 'High' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                          task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          'bg-green-500/10 text-green-600 border-green-500/20'
                        }>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        {!focusMode && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-bold text-lg">{completedToday}/{totalToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">High Priority</span>
                <span className="font-bold text-lg text-red-600">{highPriorityCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Upcoming</span>
                <span className="font-bold text-lg text-purple-600">{upcomingCount}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedTaskId && (
        <TaskDialog 
          open={taskDialogOpen} 
          onOpenChange={setTaskDialogOpen} 
          taskId={selectedTaskId} 
        />
      )}

      <CreateTaskDialog 
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
      />
    </div>
  );
}
