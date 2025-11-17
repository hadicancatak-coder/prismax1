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
import { CalendarIcon, GripVertical, Info, RotateCcw, LayoutGrid, List } from "lucide-react";
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
import { CalendarKanbanView } from "@/components/calendar/CalendarKanbanView";
import { expandRecurringTask, getRecurrenceLabel } from "@/lib/recurrenceExpander";
import { useToast } from "@/hooks/use-toast";

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
  const [userTaskOrder, setUserTaskOrder] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [completions, setCompletions] = useState<any[]>([]);
  const currentDate = new Date();
  const { toast } = useToast();

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

  // Fetch user's custom task order when in manual mode
  useEffect(() => {
    if (sortOption === 'manual' && user) {
      fetchUserTaskOrder();
    }
  }, [sortOption, dateView, dateRange, user]);

  const fetchUserTaskOrder = async () => {
    if (!user) return;

    let dateScope: string = dateView;
    if (dateView === 'custom' && dateRange?.from) {
      dateScope = `custom-${format(dateRange.from, 'yyyy-MM-dd')}`;
    }

    const { data, error } = await supabase
      .from('user_task_order')
      .select('task_id, order_index')
      .eq('user_id', user.id)
      .eq('date_scope', dateScope);

    if (error) {
      console.error('Error fetching user task order:', error);
      return;
    }

    const orderMap: Record<string, number> = {};
    data?.forEach(item => {
      orderMap[item.task_id] = item.order_index;
    });
    setUserTaskOrder(orderMap);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, name, username");
    setUsers(data || []);
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchCompletions = async () => {
      const { data } = await supabase
        .from('recurring_task_completions')
        .select('*')
        .order('completed_date', { ascending: false});
      
      setCompletions(data || []);
    };
    
    fetchCompletions();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('recurring_completions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'recurring_task_completions'
      }, () => {
        fetchCompletions();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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

    const expandedTasks: any[] = [];

    allTasks.forEach(task => {
      if (task.task_type === 'recurring' && task.recurrence_rrule) {
        // Expand recurring task into occurrences
        const occurrences = expandRecurringTask(
          task,
          startDate,
          endDate,
          completions.filter(c => c.task_id === task.id)
        );
        
        // Convert each occurrence to a task-like object
        occurrences.forEach(occ => {
          expandedTasks.push({
            ...task,
            id: `${task.id}::${occ.occurrenceDate.getTime()}`,
            originalTaskId: task.id,
            due_at: occ.occurrenceDate.toISOString(),
            status: occ.isCompleted ? 'Completed' : task.status,
            isRecurringOccurrence: true,
            completionId: occ.completionId,
          });
        });
      } else if (task.due_at) {
        // Regular task with due date
        const dueDate = new Date(task.due_at);
        const inDateRange = dueDate >= startDate && dueDate <= endDate;
        
        if (inDateRange) {
          expandedTasks.push(task);
        }
      }
    });

    // Filter by selected user
    return expandedTasks.filter(task => {
      const userMatch = !selectedUserId || 
        task.assignees?.some((a: any) => a.user_id === selectedUserId);
      return userMatch;
    });
  }, [allTasks, dateView, dateRange, selectedUserId, completions]);

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
        // Use user-specific order from user_task_order table
        return tasks.sort((a, b) => {
          const orderA = userTaskOrder[a.id] ?? 999999;
          const orderB = userTaskOrder[b.id] ?? 999999;
          return orderA - orderB;
        });
      
      default:
        return tasks;
    }
  }, [filteredTasks, sortOption, userTaskOrder]);

  // Split tasks into active and completed
  const activeTasks = sortedTasks.filter(t => t.status !== 'Completed');
  const completedTasks = sortedTasks.filter(t => t.status === 'Completed');

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    // Check if this is a recurring occurrence
    if (taskId.includes('::')) {
      const [originalTaskId, timestamp] = taskId.split('::');
      const occurrenceDate = new Date(parseInt(timestamp));
      
      if (completed) {
        // Mark this specific date as complete
        const { error } = await supabase
          .from('recurring_task_completions')
          .insert({
            task_id: originalTaskId,
            completed_by: user.id,
            completed_date: format(occurrenceDate, 'yyyy-MM-dd'),
            completed_at: new Date().toISOString(),
          });
        
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Marked complete", description: `Completed for ${format(occurrenceDate, 'MMM dd')}` });
        }
      } else {
        // Unmark completion
        const task = filteredTasks.find(t => t.id === taskId);
        if (task?.completionId) {
          await supabase
            .from('recurring_task_completions')
            .delete()
            .eq('id', task.completionId);
          
          toast({ title: "Unmarked", description: "Completion removed" });
        }
      }
    } else {
      // Regular task completion
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: completed ? 'Completed' : 'Pending',
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        toast({ 
          title: "Error", 
          description: "Failed to update task", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: completed ? "Task completed" : "Task reopened",
          description: completed ? "Great job!" : "Task marked as pending"
        });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !user) return;

    const oldIndex = activeTasks.findIndex(t => t.id === active.id);
    const newIndex = activeTasks.findIndex(t => t.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Create new order
    const reorderedTasks = [...activeTasks];
    const [movedTask] = reorderedTasks.splice(oldIndex, 1);
    reorderedTasks.splice(newIndex, 0, movedTask);

    // Determine current date scope
    let dateScope: string = dateView;
    if (dateView === 'custom' && dateRange?.from) {
      dateScope = `custom-${format(dateRange.from, 'yyyy-MM-dd')}`;
    }

    // Save user-specific task order to user_task_order table
    const orderPromises = reorderedTasks.map((task, index) => 
      supabase
        .from('user_task_order')
        .upsert({
          user_id: user.id,
          task_id: task.id,
          date_scope: dateScope,
          order_index: index,
        }, {
          onConflict: 'user_id,task_id,date_scope'
        })
    );

    try {
      await Promise.all(orderPromises);
      
      // Refresh the user's task order
      await fetchUserTaskOrder();
      
      // Invalidate query to refresh
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error saving task order:', error);
    }
  };

  const handleResetOrder = async () => {
    if (!user) return;

    let dateScope: string = dateView;
    if (dateView === 'custom' && dateRange?.from) {
      dateScope = `custom-${format(dateRange.from, 'yyyy-MM-dd')}`;
    }

    try {
      await supabase
        .from('user_task_order')
        .delete()
        .eq('user_id', user.id)
        .eq('date_scope', dateScope);

      setUserTaskOrder({});
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error resetting task order:', error);
    }
  };

  const completedToday = filteredTasks.filter(t => t.status === 'Completed').length;
  const totalToday = filteredTasks.length;
  const highPriorityCount = filteredTasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
  const upcomingCount = filteredTasks.filter(t => t.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-12 py-6 lg:py-8">
      {!focusMode && (
        <>
          <header className="mb-8 max-w-7xl mx-auto">
            <h1 className="text-page-title mb-2">Agenda</h1>
            <p className="text-muted-foreground">{format(currentDate, 'EEEE, MMMM d, yyyy')}</p>
            
            {userRole === 'admin' && users.length > 0 && (
              <div className="mt-4 max-w-xs mx-auto sm:mx-0">
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

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
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
              
              {sortOption === 'manual' && Object.keys(userTaskOrder).length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetOrder}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Order
                </Button>
              )}

              {/* List/Kanban Toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'kanban')}>
                <TabsList>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="h-4 w-4" />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Kanban
                  </TabsTrigger>
                </TabsList>
              </Tabs>
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

      {/* Centered content - removed sidebar */}
      <div className="max-w-7xl mx-auto mt-6 lg:mt-8">
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
              {viewMode === 'list' ? (
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
                                // Extract original task ID if this is a recurring occurrence
    const originalId = id.includes('::') ? id.split('::')[0] : id;
                                setSelectedTaskId(originalId);
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
                      // Extract original task ID if this is a recurring occurrence
    const originalId = id.includes('::') ? id.split('::')[0] : id;
                      setSelectedTaskId(originalId);
                      setTaskDialogOpen(true);
                    }}
                    onTaskComplete={handleTaskComplete}
                  />
                </>
              ) : (
                <CalendarKanbanView
                  tasks={activeTasks}
                  view={
                    dateView === 'today' || dateView === 'yesterday' || dateView === 'tomorrow' 
                      ? 'day' 
                      : dateView === 'custom'
                      ? 'week' 
                      : dateView as 'week' | 'month'
                  }
                  dateView={dateView}
                  workingDays={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']}
                  selectedDate={
                    dateView === 'yesterday' ? subDays(currentDate, 1) :
                    dateView === 'tomorrow' ? addDays(currentDate, 1) :
                    dateView === 'week' ? startOfWeek(currentDate, { weekStartsOn: 1 }) :
                    dateView === 'month' ? startOfMonth(currentDate) :
                    dateRange?.from || currentDate
                  }
                  onTaskClick={(id: string) => {
                    // Extract original task ID if this is a recurring occurrence
                    const originalId = id.includes('::') ? id.split('::')[0] : id;
                    setSelectedTaskId(originalId);
                    setTaskDialogOpen(true);
                  }}
                />
              )}
            </>
          )}
        </div>
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
