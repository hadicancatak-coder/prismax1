import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskDialog } from "@/components/TaskDialog";
import { LaunchCampaignDetailDialog } from "@/components/LaunchCampaignDetailDialog";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Circle, CheckCircle, MoreVertical, AlertCircle, Rocket } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function CalendarView() {
  document.title = "Agenda - Prisma";
  const { user, userRole, roleLoading } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [userWorkingDays, setUserWorkingDays] = useState<string>("mon-fri");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    // 🛡️ GUARD: Don't fetch until role is loaded
    if (roleLoading) {
      console.log("⏳ Calendar: Waiting for role to load...");
      return;
    }
    
    console.log("✅ Calendar: Role loaded, fetching data...", { userRole, selectedUserId });
    
    fetchUserWorkingDays();
    fetchTasks();
    fetchCampaigns();
    if (userRole === "admin") {
      fetchUsers();
    }

    const tasksChannel = supabase
      .channel('tasks-calendar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
      .subscribe();

    const campaignsChannel = supabase
      .channel('campaigns-calendar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'launch_pad_campaigns' }, () => fetchCampaigns())
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles-calendar')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        if (payload.new.working_days) {
          setUserWorkingDays(payload.new.working_days);
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(campaignsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [selectedUserId, userRole, roleLoading, user?.id]);

  const fetchUserWorkingDays = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("working_days")
      .eq("user_id", user.id)
      .single();
    
    if (data?.working_days) {
      setUserWorkingDays(data.working_days);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("public_profiles").select("user_id, name, username");
    setAllUsers(data || []);
  };

  const fetchTasks = async () => {
    // 🛡️ GUARD: Don't run if role is not loaded yet
    if (roleLoading) {
      console.log("⏳ fetchTasks: Role still loading, skipping...");
      return;
    }
    
    console.log("🔍 fetchTasks called with:", { userRole, selectedUserId });
    
    // ✅ EXPLICIT CHECK: Admin viewing all members
    if (userRole === "admin" && selectedUserId === "all") {
      console.log("👥 Fetching ALL tasks (admin mode)");
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .not("due_at", "is", null)
        .order("due_at", { ascending: true });
      
      if (error) {
        console.error("❌ Error fetching all tasks:", error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        console.log(`✅ Fetched ${data?.length || 0} total tasks`);
        setTasks(data || []);
      }
      return; // Early return
    }
    
    // Get the profile.id for the user being viewed
    let profileId: string | null = null;
    
    if (userRole === "admin" && selectedUserId && selectedUserId !== "all") {
      console.log("👤 Admin viewing specific user:", selectedUserId);
      // Admin viewing specific user - get that user's profile.id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", selectedUserId)
        .single();
      profileId = profile?.id || null;
    } else if (userRole !== "admin" && user?.id) {
      console.log("👤 Regular user viewing own tasks");
      // Regular user viewing their own tasks - get their profile.id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      profileId = profile?.id || null;
    }

    if (profileId) {
      console.log("🔍 Fetching tasks for profileId:", profileId);
      // Fetch tasks assigned to this specific user
      const { data: assignedTaskIds } = await supabase
        .from("task_assignees")
        .select("task_id")
        .eq("user_id", profileId);
      
      const taskIds = assignedTaskIds?.map(a => a.task_id) || [];
      console.log(`📋 Found ${taskIds.length} assigned task IDs`);
      
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .not("due_at", "is", null)
        .in("id", taskIds.length > 0 ? taskIds : ['00000000-0000-0000-0000-000000000000'])
        .order("due_at", { ascending: true });
      
      if (error) {
        console.error("❌ Error fetching user tasks:", error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        console.log(`✅ Fetched ${data?.length || 0} tasks for user`);
        setTasks(data || []);
      }
    }
  };

  const fetchCampaigns = async () => {
    // 🛡️ GUARD: Don't run if role is not loaded yet
    if (roleLoading) {
      console.log("⏳ fetchCampaigns: Role still loading, skipping...");
      return;
    }
    
    console.log("🔍 fetchCampaigns called with:", { userRole, selectedUserId });
    
    // ✅ EXPLICIT CHECK: Admin viewing all members
    if (userRole === "admin" && selectedUserId === "all") {
      console.log("👥 Fetching ALL campaigns (admin mode)");
      const { data } = await supabase
        .from("launch_pad_campaigns")
        .select(`
          *,
          launch_campaign_assignees(
            user_id,
            profiles!launch_campaign_assignees_user_id_fkey(name, avatar_url)
          )
        `)
        .not("launch_date", "is", null)
        .in("status", ["live", "orbit"]);
      
      console.log(`✅ Fetched ${data?.length || 0} total campaigns`);
      setCampaigns(data || []);
      return; // Early return
    }
    
    // Get the profile.id for the user being viewed
    let profileId: string | null = null;
    
    if (userRole !== "admin" && user?.id) {
      console.log("👤 Regular user viewing own campaigns");
      // Regular user - get their profile.id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      profileId = profile?.id || null;
    } else if (userRole === "admin" && selectedUserId && selectedUserId !== "all") {
      console.log("👤 Admin viewing specific user:", selectedUserId);
      // Admin viewing specific user - get that user's profile.id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", selectedUserId)
        .single();
      profileId = profile?.id || null;
    }

    let query = supabase
      .from("launch_pad_campaigns")
      .select(`
        *,
        launch_campaign_assignees(
          user_id,
          profiles!launch_campaign_assignees_user_id_fkey(name, avatar_url)
        )
      `)
      .not("launch_date", "is", null)
      .in("status", ["live", "orbit"]);

    if (profileId) {
      console.log("🔍 Fetching campaigns for profileId:", profileId);
      // Filter to only campaigns assigned to this user
      const { data: assignedCampaigns } = await supabase
        .from("launch_campaign_assignees")
        .select("campaign_id")
        .eq("user_id", profileId);
      
      const campaignIds = assignedCampaigns?.map(a => a.campaign_id) || [];
      console.log(`📋 Found ${campaignIds.length} assigned campaign IDs`);
      query = query.in("id", campaignIds.length > 0 ? campaignIds : ['00000000-0000-0000-0000-000000000000']);
    }

    const { data } = await query;
    console.log(`✅ Fetched ${data?.length || 0} campaigns`);
    setCampaigns(data || []);
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

  const handleStatusChange = async (taskId: string, newStatus: "Pending" | "Ongoing" | "Completed" | "Failed" | "Blocked") => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated", description: `Task marked as ${newStatus}` });
      await fetchTasks();
    }
  };

  const isWorkingDay = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    
    if (userWorkingDays === 'mon-fri') {
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    } else if (userWorkingDays === 'sun-thu') {
      return dayOfWeek === 0 || (dayOfWeek >= 1 && dayOfWeek <= 4);
    }
    
    return true;
  };

  const getTasksForDate = (date: Date) => {
    let filtered = tasks.filter(task => task.due_at && isSameDay(parseISO(task.due_at), date));
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (priorityFilter !== "all") {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }
    
    return filtered;
  };

  const getCampaignsForDate = (date: Date) => {
    return campaigns.filter(campaign => 
      campaign.launch_date && isSameDay(parseISO(campaign.launch_date), date)
    );
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

  // Task Card Component
  const TaskCard = ({ task, compact = false, completed = false }: any) => {
    return (
      <div
        className={cn(
          "group p-4 border rounded-lg hover:shadow-md transition-all",
          completed && "opacity-60"
        )}
      >
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 mt-0.5"
            onClick={() => handleStatusChange(task.id, task.status === 'Completed' ? 'Ongoing' : 'Completed')}
          >
            {task.status === 'Completed' ? (
              <CheckCircle className="h-5 w-5 text-success fill-success" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <div
              className="cursor-pointer"
              onClick={() => {
                setSelectedTaskId(task.id);
                setTaskDialogOpen(true);
              }}
            >
              <h4 className={cn("font-medium mb-1", completed && "line-through")}>
                {task.title}
              </h4>
              {!compact && task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-2">
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
              <Badge variant="outline">{task.status}</Badge>
              {task.entity && <Badge variant="secondary">{task.entity}</Badge>}
            </div>
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'Ongoing')}>
                  Start Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const newDate = addDays(new Date(task.due_at), 1);
                  moveTask(task.id, newDate);
                }}>
                  Postpone to Tomorrow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedTaskId(task.id);
                  setTaskDialogOpen(true);
                }}>
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  // Campaign Card Component
  const CampaignCard = ({ campaign, compact = false }: any) => {
    return (
      <div 
        className="group p-4 border border-primary/30 rounded-lg hover:shadow-md transition-all bg-primary/5 cursor-pointer"
        onClick={() => {
          setSelectedCampaignId(campaign.id);
          setCampaignDialogOpen(true);
        }}
      >
        <div className="flex items-start gap-3">
          <Rocket className="h-5 w-5 text-primary mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium mb-1 flex items-center gap-2">
              {campaign.title}
              <Badge variant="outline" className="text-xs">
                🚀 Campaign
              </Badge>
            </h4>
            {!compact && campaign.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {campaign.description}
              </p>
            )}

            <div className="flex gap-2 mt-2 flex-wrap">
              {campaign.teams?.map((team: string) => (
                <Badge key={team} variant="secondary" className="text-xs">
                  {team}
                </Badge>
              ))}
              {campaign.entity?.slice(0, 2).map((country: string) => (
                <Badge key={country} variant="outline" className="text-xs">
                  🌍 {country}
                </Badge>
              ))}
              <Badge 
                variant="outline" 
                className={
                  campaign.status === 'live' 
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-warning/10 text-warning border-warning/20"
                }
              >
                {campaign.status === 'live' ? '🛰️ Live' : '🚧 Prep'}
              </Badge>
            </div>

            {campaign.launch_campaign_assignees?.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex -space-x-2">
                  {campaign.launch_campaign_assignees.slice(0, 3).map((assignee: any) => (
                    <Avatar key={assignee.user_id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={assignee.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {assignee.profiles?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {campaign.launch_campaign_assignees.length} assigned
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDailyView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const dayCampaigns = getCampaignsForDate(currentDate);
    const isToday = isSameDay(currentDate, new Date());
    
    const overdueTasks = dayTasks.filter(t => t.status !== 'Completed' && new Date(t.due_at) < new Date());
    const highPriorityTasks = dayTasks.filter(t => t.priority === 'High' && t.status !== 'Completed');
    const inProgressTasks = dayTasks.filter(t => t.status === 'Ongoing');
    const pendingTasks = dayTasks.filter(t => t.status === 'Pending');
    const completedTasks = dayTasks.filter(t => t.status === 'Completed');
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              {isToday ? "Today's Agenda" : format(currentDate, "EEEE, MMMM dd, yyyy")}
            </h2>
            <p className="text-muted-foreground mt-1">
              {dayTasks.length} tasks • {dayCampaigns.length} campaigns • {completedTasks.length} completed
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="default" onClick={() => setCurrentDate(new Date())}>
              {isToday ? "Refresh" : "Go to Today"}
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-320px)] pr-4">
          <div className="space-y-6">
            {isToday && highPriorityTasks.length > 0 && (
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-primary">Today's Focus</Badge>
                  <span className="text-sm text-muted-foreground">
                    {highPriorityTasks.length} high-priority {highPriorityTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                <div className="space-y-2">
                  {highPriorityTasks.slice(0, 3).map(task => (
                    <TaskCard key={task.id} task={task} compact />
                  ))}
                </div>
              </Card>
            )}

            {overdueTasks.length > 0 && (
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="font-semibold text-destructive">
                    {overdueTasks.length} overdue {overdueTasks.length === 1 ? 'task' : 'tasks'} from previous days
                  </p>
                </div>
              </Card>
            )}

            <div className="grid gap-6">
          {inProgressTasks.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                <h3 className="font-semibold text-lg">In Progress ({inProgressTasks.length})</h3>
              </div>
              <div className="space-y-3">
                {inProgressTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </Card>
          )}

          {pendingTasks.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">To Do ({pendingTasks.length})</h3>
              <div className="space-y-3">
                {pendingTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </Card>
          )}

          {completedTasks.length > 0 && (
            <Card className="p-6 opacity-60">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Completed ({completedTasks.length})
              </h3>
              <div className="space-y-3">
                {completedTasks.map(task => (
                  <TaskCard key={task.id} task={task} completed />
                ))}
              </div>
            </Card>
          )}

          {dayCampaigns.length > 0 && (
            <Card className="p-6 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <Rocket className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">
                  Campaign Launches ({dayCampaigns.length})
                </h3>
              </div>
              <div className="space-y-3">
                {dayCampaigns.map(campaign => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            </Card>
          )}

            {dayTasks.length === 0 && dayCampaigns.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground text-lg">
                  {isToday ? "No tasks or campaigns scheduled for today! 🎉" : "No tasks or campaigns scheduled for this day"}
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setCurrentDate(new Date())}>
                  Go to Today
                </Button>
              </Card>
            )}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderWeeklyView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const weekTasks = days.flatMap(day => getTasksForDate(day));
    const completedCount = weekTasks.filter(t => t.status === 'Completed').length;
    const highPriorityCount = weekTasks.filter(t => t.priority === 'High').length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Week of {format(weekStart, "MMM dd")} - {format(weekEnd, "MMM dd, yyyy")}
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

        <Card className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{weekTasks.length}</p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{highPriorityCount}</p>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-7 gap-3">
          {days.map(day => {
            const dayTasks = getTasksForDate(day);
            const isToday = isSameDay(day, new Date());
            const isWorking = isWorkingDay(day);
            const completedCount = dayTasks.filter(t => t.status === 'Completed').length;

            return (
              <Card
                key={day.toISOString()}
                className={cn(
                  "p-3 cursor-pointer transition-all min-h-[180px]",
                  !isWorking && "opacity-30 bg-muted/30",
                  isToday && "ring-2 ring-primary shadow-lg",
                  selectedDate && isSameDay(day, selectedDate) && "ring-2 ring-accent"
                )}
                onClick={() => setSelectedDate(day)}
              >
                <div className="mb-3 pb-2 border-b">
                  <div className="font-semibold text-sm">{format(day, "EEE")}</div>
                  <div className="text-2xl font-bold">{format(day, "dd")}</div>
                  {dayTasks.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {completedCount}/{dayTasks.length}
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-[120px] overflow-y-auto">
                  {dayTasks.slice(0, 4).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
                      className={cn(
                        "p-2 rounded text-xs cursor-move transition-all",
                        task.status === 'Completed' && "opacity-50 line-through",
                        task.priority === 'High' && "bg-destructive/10 border border-destructive/20",
                        task.priority === 'Medium' && "bg-warning/10 border border-warning/20",
                        task.priority === 'Low' && "bg-muted"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTaskId(task.id);
                        setTaskDialogOpen(true);
                      }}
                    >
                      <div className="font-medium truncate">{task.title}</div>
                    </div>
                  ))}
                  {dayTasks.length > 4 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayTasks.length - 4} more
                    </div>
                  )}
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData("taskId");
                    moveTask(taskId, day);
                  }}
                  className="mt-2 h-6 border-2 border-dashed border-transparent hover:border-primary/20 rounded transition-colors"
                />
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
            const isWorking = isWorkingDay(day);

            return (
              <Card
                key={day.toISOString()}
                className={cn(
                  "p-2 min-h-[100px] cursor-pointer transition-all",
                  !isCurrentMonth && "opacity-40",
                  !isWorking && "opacity-50 bg-muted/30",
                  isToday && "ring-2 ring-primary",
                  selectedDate && isSameDay(day, selectedDate) && "ring-2 ring-accent"
                )}
                onClick={() => setSelectedDate(day)}
              >
                <div className="text-sm font-semibold mb-1 flex items-center justify-between">
                  <span>{format(day, "d")}</span>
                  {!isWorking && <span className="text-xs text-muted-foreground">Off</span>}
                </div>
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
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          {userRole === "admin" && (
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-[250px] mt-2">
                <SelectValue placeholder="Filter by member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                {allUsers.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.name || u.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "daily" && (
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Ongoing">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {view === "daily" && renderDailyView()}
      {view === "weekly" && renderWeeklyView()}
      {view === "monthly" && renderMonthlyView()}

      {selectedDate && view !== "daily" && (
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
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No tasks for this day</p>
            )}
          </div>
        </Card>
      )}

      {selectedTaskId && (
        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          taskId={selectedTaskId}
        />
      )}

      {selectedCampaignId && (
        <LaunchCampaignDetailDialog
          open={campaignDialogOpen}
          onOpenChange={setCampaignDialogOpen}
          campaignId={selectedCampaignId}
          onUpdate={fetchCampaigns}
        />
      )}
    </div>
  );
}