import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useQueryClient } from "@tanstack/react-query";
import { TaskDialog } from "@/components/TaskDialog";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format, startOfDay, endOfDay, subDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, GripVertical, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { CompletedTasksSection } from "@/components/tasks/CompletedTasksSection";
import { TaskSortDropdown, SortOption } from "@/components/tasks/TaskSortDropdown";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";

// Sortable Task Item Component
function SortableTaskItem({ task, onTaskClick, onTaskComplete, isManualMode = false }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: !isManualMode
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...(isDragging && {
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
      borderRadius: '8px',
      border: '2px dashed hsl(var(--primary))',
      backgroundColor: 'hsl(var(--background))',
    })
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-3 py-4 border-b border-border hover:bg-muted/50 transition-smooth cursor-pointer group",
        isDragging && "z-50"
      )}
      onClick={() => onTaskClick(task.id)}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              {...(isManualMode ? attributes : {})}
              {...(isManualMode ? listeners : {})}
              className={cn(
                "transition-all duration-200",
                isManualMode 
                  ? "cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100" 
                  : "cursor-not-allowed opacity-30"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className={cn(
                "w-5 h-5",
                isManualMode ? "text-muted-foreground" : "text-muted-foreground/40"
              )} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            {isManualMode ? (
              <p className="text-xs">Drag to reorder</p>
            ) : (
              <p className="text-xs">Switch to "Manual Order" to drag & drop</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Checkbox
        checked={task.status === 'Completed'}
        onCheckedChange={(checked) => onTaskComplete(task.id, checked as boolean)}
        onClick={(e) => e.stopPropagation()}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={`text-body font-medium ${task.status === 'Completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {task.title}
          </h4>
          <Badge variant="outline" className={
            task.priority === 'High' ? 'border-destructive text-destructive' :
            task.priority === 'Medium' ? 'border-primary text-primary' :
            'border-border text-muted-foreground'
          }>
            {task.priority}
          </Badge>
        </div>
        {task.description && (
          <p className="text-metadata line-clamp-1">
            {task.description.replace(/<[^>]*>/g, '').substring(0, 100)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CalendarView() {
  document.title = "Agenda - Prisma";
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const { data: allTasks, isLoading } = useTasks();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dateView, setDateView] = useState<"today" | "yesterday" | "tomorrow" | "week" | "month" | "custom">("today");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    return (localStorage.getItem("agenda-sort") as SortOption) || "priority";
  });
  const currentDate = new Date();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem("agenda-sort", sortOption);
  }, [sortOption]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, name, username");
    setUsers(data || []);
  };

  // Filter tasks by date range
  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];

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
      case "month":
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      case "custom":
        if (dateRange?.from) {
          startDate = startOfDay(dateRange.from);
          endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
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

    return allTasks.filter((task: any) => {
      if (!task.due_at) return false;
      const dueDate = new Date(task.due_at);
      return dueDate >= startDate && dueDate <= endDate;
    });
  }, [allTasks, dateView, dateRange]);

  // Sort tasks based on selected option
  const sortedTasks = useMemo(() => {
    const tasks = [...filteredTasks];
    
    switch (sortOption) {
      case "priority":
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        return tasks.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);
      
      case "due_time":
        return tasks.sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
      
      case "status":
        const statusOrder = { Pending: 0, Ongoing: 1, Blocked: 2, Completed: 3, Failed: 4 };
        return tasks.sort((a, b) => statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]);
      
      case "alphabetical":
        return tasks.sort((a, b) => a.title.localeCompare(b.title));
      
      case "manual":
        return tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      
      default:
        return tasks;
    }
  }, [filteredTasks, sortOption]);

  // Split tasks into active and completed
  const activeTasks = sortedTasks.filter(t => t.status !== 'Completed');
  const completedTasks = sortedTasks.filter(t => t.status === 'Completed');

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    await supabase
      .from('tasks')
      .update({ status: completed ? 'Completed' : 'Pending' })
      .eq('id', taskId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = activeTasks.findIndex(t => t.id === active.id);
    const newIndex = activeTasks.findIndex(t => t.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Create new order
    const reorderedTasks = [...activeTasks];
    const [movedTask] = reorderedTasks.splice(oldIndex, 1);
    reorderedTasks.splice(newIndex, 0, movedTask);

    // Update order_index for all affected tasks
    const updates = reorderedTasks.map((task, index) => 
      supabase
        .from('tasks')
        .update({ order_index: index })
        .eq('id', task.id)
    );

    await Promise.all(updates);
    
    // Invalidate query to refresh
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const completedToday = filteredTasks.filter(t => t.status === 'Completed').length;
  const totalToday = filteredTasks.length;
  const highPriorityCount = filteredTasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
  const upcomingCount = filteredTasks.filter(t => t.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-12 py-6 lg:py-8">
      {!focusMode && (
        <>
          <header className="mb-8">
            <h1 className="text-page-title mb-2">Agenda</h1>
            <p className="text-muted-foreground">{format(currentDate, 'EEEE, MMMM d, yyyy')}</p>
            
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

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
              <Tabs value={dateView} onValueChange={(v) => {
                const newView = v as typeof dateView;
                setDateView(newView);
                if (newView !== "custom") {
                  setDateRange(undefined);
                }
              }} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-3 sm:flex w-full sm:w-auto">
                  <TabsTrigger value="yesterday" className="min-h-[44px]">Yesterday</TabsTrigger>
                  <TabsTrigger value="today" className="min-h-[44px]">Today</TabsTrigger>
                  <TabsTrigger value="tomorrow" className="min-h-[44px]">Tomorrow</TabsTrigger>
                  <TabsTrigger value="week" className="min-h-[44px] hidden sm:inline-flex">This Week</TabsTrigger>
                  <TabsTrigger value="month" className="min-h-[44px] hidden sm:inline-flex">This Month</TabsTrigger>
                  <TabsTrigger value="custom" className="min-h-[44px]">Custom</TabsTrigger>
                </TabsList>
              </Tabs>

              {dateView === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal min-w-[260px]">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to && !isSameDay(dateRange.from, dateRange.to) ? (
                          `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                        ) : (
                          format(dateRange.from, "MMM d, yyyy")
                        )
                      ) : (
                        "Pick a date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DateRangePicker
                      value={dateRange}
                      onChange={(range) => {
                        setDateRange(range);
                        if (range) {
                          setDateView("custom");
                        }
                      }}
                      presets="full"
                    />
                  </PopoverContent>
                </Popover>
              )}

              <TaskSortDropdown value={sortOption} onChange={setSortOption} />
            </div>
          </header>
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

      <div className={`grid gap-6 lg:gap-8 mt-6 lg:mt-8 ${focusMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        <div className={focusMode ? '' : 'lg:col-span-2'}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-section-title">
              {dateView === "today" && "Today's Tasks"} 
              {dateView === "yesterday" && "Yesterday's Tasks"}
              {dateView === "tomorrow" && "Tomorrow's Tasks"}
              {dateView === "week" && "This Week's Tasks"}
              {dateView === "month" && "This Month's Tasks"}
              {dateView === "custom" && "Custom Range Tasks"}
              ({activeTasks.length})
            </h2>
            {focusMode && (
              <Button variant="outline" size="sm" onClick={() => setFocusMode(false)}>
              Exit Focus Mode
              </Button>
            )}
          </div>
          <div>
            {isLoading ? (
              <ListSkeleton items={5} />
            ) : (
            <>
              {activeTasks.length > 0 && sortOption !== "manual" && (
                <Alert className="mb-4 border-primary/50 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    💡 <strong>Tip:</strong> Switch to "Manual Order" in the sort dropdown to drag & drop tasks into your preferred order
                  </AlertDescription>
                </Alert>
              )}
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activeTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                  disabled={sortOption !== "manual"}
                >
                  <div className="space-y-2">
                    {activeTasks.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No active tasks for this period</p>
                    ) : (
                      activeTasks.map((task) => (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          onTaskClick={(id: string) => {
                            setSelectedTaskId(id);
                            setTaskDialogOpen(true);
                          }}
                          onTaskComplete={handleTaskComplete}
                          isManualMode={sortOption === "manual"}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </DndContext>

              <CompletedTasksSection
                tasks={completedTasks}
                onTaskClick={(id: string) => {
                  setSelectedTaskId(id);
                  setTaskDialogOpen(true);
                }}
                onTaskComplete={handleTaskComplete}
              />
            </>
            )}
          </div>
        </div>
        
        {!focusMode && (
          <div>
            <h2 className="text-section-title mb-6">Quick Stats</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-metadata">Completed</span>
                <span className="text-2xl font-semibold">{completedToday}/{totalToday}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-metadata">High Priority</span>
                <span className="text-2xl font-semibold text-destructive">{highPriorityCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-metadata">Upcoming</span>
                <span className="text-2xl font-semibold text-primary">{upcomingCount}</span>
              </div>
            </div>
          </div>
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
