import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useUserAgenda } from "@/hooks/useUserAgenda";
import { useQueryClient } from "@tanstack/react-query";
import { UnifiedTaskDialog } from "@/components/UnifiedTaskDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format, startOfDay, endOfDay, subDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, GripVertical, Info, RotateCcw, LayoutGrid, List, AlertTriangle, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { CompletedTasksSection } from "@/components/tasks/CompletedTasksSection";
import { AgendaTaskPool } from "@/components/calendar/AgendaTaskPool";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";
import { CalendarKanbanView } from "@/components/calendar/CalendarKanbanView";
import { expandRecurringTask, getRecurrenceLabel } from "@/lib/recurrenceExpander";
import { useToast } from "@/hooks/use-toast";
import { isTaskOverdue, getDaysOverdue } from "@/lib/overdueHelpers";

// Sortable Task Item Component
function SortableTaskItem({ task, onTaskClick, onTaskComplete, onRemoveFromAgenda, isManualMode = false, showRemove = false }: any) {
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
        <div className="flex items-center gap-2 mb-1 flex-wrap">
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
          {task.isRecurringOccurrence && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-primary/10 border-primary/30 flex items-center gap-1">
              <RotateCcw className="h-2.5 w-2.5" />
              {getRecurrenceLabel(task)}
            </Badge>
          )}
          {task.isRecurringTask && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-primary/10 border-primary/30 flex items-center gap-1">
              <RotateCcw className="h-2.5 w-2.5" />
              {getRecurrenceLabel(task)} • {task.completedCount}/{task.occurrenceCount}
            </Badge>
          )}
          {task.isAutoAdded && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-muted border-muted-foreground/30">
              Auto
            </Badge>
          )}
        </div>
        {task.description && (
          <p className="text-metadata line-clamp-1">
            {task.description.replace(/<[^>]*>/g, '').substring(0, 100)}
          </p>
        )}
      </div>
      {showRemove && onRemoveFromAgenda && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromAgenda([task.id]);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove from agenda"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      )}
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
  const [sortOption, setSortOption] = useState<string>(() => {
    return localStorage.getItem("agenda-sort") || "priority";
  });
  const [userTaskOrder, setUserTaskOrder] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [completions, setCompletions] = useState<any[]>([]);
  const currentDate = new Date();
  const { toast } = useToast();

  // Calculate the selected date for agenda
  const selectedDate = useMemo(() => {
    switch (dateView) {
      case "yesterday": return subDays(new Date(), 1);
      case "tomorrow": return addDays(new Date(), 1);
      default: return dateRange?.from || new Date();
    }
  }, [dateView, dateRange]);

  // Use the agenda hook
  const { 
    agendaTasks, 
    availableTasks, 
    agendaItems,
    addToAgenda, 
    removeFromAgenda,
    isAdding,
    isLoading: agendaLoading 
  } = useUserAgenda({
    userId: selectedUserId || user?.id,
    date: selectedDate,
    allTasks: allTasks || [],
    completions,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch users for admin filter
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, name, username");
      setUsers(data || []);
    };
    fetchUsers();
  }, []);

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

  useEffect(() => {
    if (!user) return;
    
    const fetchCompletions = async () => {
      const { data } = await supabase
        .from('recurring_task_completions')
        .select('*')
        .order('completed_date', { ascending: false });
      
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

  // Enrich agenda tasks with auto-added flag
  const enrichedAgendaTasks = useMemo(() => {
    return agendaTasks.map(task => {
      const agendaItem = agendaItems.find(item => item.task_id === task.id);
      return {
        ...task,
        isAutoAdded: agendaItem?.is_auto_added || false,
      };
    });
  }, [agendaTasks, agendaItems]);

  // Sort tasks based on selected option
  const sortedAgendaTasks = useMemo(() => {
    const tasks = [...enrichedAgendaTasks];
    
    switch (sortOption) {
      case "priority":
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        return tasks.sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 2));
      
      case "due_time":
        return tasks.sort((a, b) => new Date(a.due_at || 0).getTime() - new Date(b.due_at || 0).getTime());
      
      case "status":
        const statusOrder = { Pending: 0, Ongoing: 1, Blocked: 2, Completed: 3, Failed: 4 };
        return tasks.sort((a, b) => (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0));
      
      case "alphabetical":
        return tasks.sort((a, b) => a.title.localeCompare(b.title));
      
      case "manual":
        return tasks.sort((a, b) => {
          const orderA = userTaskOrder[a.id] ?? 999999;
          const orderB = userTaskOrder[b.id] ?? 999999;
          return orderA - orderB;
        });
      
      default:
        return tasks;
    }
  }, [enrichedAgendaTasks, sortOption, userTaskOrder]);

  // Split tasks into active and completed
  const activeTasks = sortedAgendaTasks.filter(t => t.status !== 'Completed');
  const completedTasks = sortedAgendaTasks.filter(t => t.status === 'Completed');

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    // Check if this is a recurring occurrence
    if (taskId.includes('::')) {
      const [originalTaskId, timestamp] = taskId.split('::');
      const occurrenceDate = new Date(parseInt(timestamp));
      
      if (completed) {
        const { error } = await supabase
          .from('recurring_task_completions')
          .insert({
            task_id: originalTaskId,
            completed_by: user?.id,
            completed_date: format(occurrenceDate, 'yyyy-MM-dd'),
            completed_at: new Date().toISOString(),
          });
        
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          await supabase.from('comments').insert({
            task_id: originalTaskId,
            author_id: user?.id,
            body: `✓ Completed recurring instance for ${format(occurrenceDate, 'EEEE, MMMM dd, yyyy')}`,
          });
          toast({ title: "Marked complete", description: `Completed for ${format(occurrenceDate, 'MMM dd')}` });
        }
      } else {
        const task = sortedAgendaTasks.find(t => t.id === taskId);
        if (task?.completionId) {
          await supabase
            .from('recurring_task_completions')
            .delete()
            .eq('id', task.completionId);
          
          await supabase.from('comments').insert({
            task_id: originalTaskId,
            author_id: user?.id,
            body: `↺ Unmarked completion for ${format(occurrenceDate, 'EEEE, MMMM dd, yyyy')}`,
          });
          toast({ title: "Unmarked", description: "Completion removed" });
        }
      }
    } else {
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

    const reorderedTasks = [...activeTasks];
    const [movedTask] = reorderedTasks.splice(oldIndex, 1);
    reorderedTasks.splice(newIndex, 0, movedTask);

    let dateScope: string = dateView;
    if (dateView === 'custom' && dateRange?.from) {
      dateScope = `custom-${format(dateRange.from, 'yyyy-MM-dd')}`;
    }

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
      await fetchUserTaskOrder();
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

  // Compute overdue tasks
  const overdueTasks = useMemo(() => {
    return (allTasks || []).filter(task => isTaskOverdue(task));
  }, [allTasks]);

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-12 py-6 lg:py-8">
      {!focusMode && (
        <>
          <header className="mb-8 max-w-7xl mx-auto">
            <h1 className="text-page-title mb-2">Agenda</h1>
            <p className="text-muted-foreground">{format(currentDate, 'EEEE, MMMM d, yyyy')}</p>
            
            {/* User Filter - Available to all users */}
            <div className="mt-4 max-w-xs">
              <Select 
                value={selectedUserId || user?.id || ''} 
                onValueChange={(value) => setSelectedUserId(value === user?.id ? null : value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="My Agenda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={user?.id || ''}>My Agenda</SelectItem>
                  {userRole === 'admin' && users.filter(u => u.user_id !== user?.id).map((u) => (
                    <SelectItem key={u.id} value={u.user_id}>
                      {u.name || u.username || 'Unknown User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date View and Filters */}
            <div className="mt-6">
              <Card className="p-3">
                <div className="flex items-center gap-2 justify-between">
                  {/* Left Section - Date View Selection */}
                  <div className="flex items-center gap-2 flex-shrink min-w-0">
                    <Tabs value={dateView} onValueChange={(v) => {
                      const newView = v as typeof dateView;
                      setDateView(newView);
                      if (newView !== "custom") {
                        setDateRange(undefined);
                      }
                    }}>
                      <TabsList className="h-9">
                        <TabsTrigger value="today" className="h-8 px-2 text-xs">Today</TabsTrigger>
                        <TabsTrigger value="tomorrow" className="h-8 px-2 text-xs">Tomorrow</TabsTrigger>
                        <TabsTrigger value="week" className="h-8 px-2 text-xs">Week</TabsTrigger>
                        <TabsTrigger value="month" className="h-8 px-2 text-xs">Month</TabsTrigger>
                        <TabsTrigger value="custom" className="h-8 px-2 text-xs">Custom</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {dateView === "custom" && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 w-9 p-0" title="Pick date range">
                            <CalendarIcon className="h-4 w-4" />
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
                  </div>

                  {/* Right Section - Sort and View */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Select value={sortOption} onValueChange={setSortOption}>
                      <SelectTrigger className="h-9 w-[80px] text-xs">
                        <span>Sort</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="due_time">Due Date</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="alphabetical">A-Z</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-9 w-9 p-0"
                      title="List View"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'kanban' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setViewMode('kanban');
                        if (dateView === 'today' || dateView === 'tomorrow') {
                          setDateView('week');
                        }
                      }}
                      className="h-9 w-9 p-0"
                      title="Kanban View"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>

                    {sortOption === 'manual' && Object.keys(userTaskOrder).length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleResetOrder}
                        className="h-9 w-9 p-0"
                        title="Reset Order"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto mt-6 lg:mt-8">
        {/* Overdue Tasks Alert */}
        {overdueTasks.length > 0 && (
          <Card className="border-l-4 border-l-destructive bg-destructive/5 mb-6">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="text-heading-sm font-semibold text-destructive">
                  Overdue Tasks ({overdueTasks.length})
                </h3>
              </div>
              <p className="text-metadata text-muted-foreground mb-4">
                These tasks need your immediate attention
              </p>
              <div className="space-y-2">
                {overdueTasks.slice(0, 3).map(task => (
                  <SortableTaskItem 
                    key={task.id} 
                    task={{
                      ...task,
                      overdueLabel: `${getDaysOverdue(task.due_at)} day${getDaysOverdue(task.due_at) !== 1 ? 's' : ''} overdue`
                    }}
                    onTaskClick={(id: string) => {
                      setSelectedTaskId(id);
                      setTaskDialogOpen(true);
                    }}
                    onTaskComplete={handleTaskComplete}
                    isManualMode={false}
                  />
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Split View: My Agenda + Available Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Agenda Section - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-md font-semibold">
                My Agenda
                <span className="text-muted-foreground font-normal ml-2">({activeTasks.length})</span>
              </h2>
            </div>

            {isLoading || agendaLoading ? (
              <ListSkeleton items={5} />
            ) : (
              <>
                {viewMode === 'list' ? (
                  <>
                    {activeTasks.length > 0 && sortOption !== "manual" && (
                      <Alert className="mb-4 border-primary/50 bg-primary/5">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-sm">
                          Switch to "Manual" sort to drag & drop tasks into your preferred order
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <Card className="overflow-hidden">
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
                          <div className="divide-y divide-border px-4">
                            {activeTasks.length === 0 ? (
                              <p className="text-muted-foreground text-center py-8">
                                No tasks in your agenda. Add tasks from the pool →
                              </p>
                            ) : (
                              activeTasks.map((task) => (
                                <SortableTaskItem
                                  key={task.id}
                                  task={task}
                                  onTaskClick={(id: string) => {
                                    const originalId = id.includes('::') ? id.split('::')[0] : id;
                                    setSelectedTaskId(originalId);
                                    setTaskDialogOpen(true);
                                  }}
                                  onTaskComplete={(taskId: string, completed: boolean) => {
                                    if (task.isRecurringTask) {
                                      setSelectedTaskId(taskId);
                                      setTaskDialogOpen(true);
                                      return;
                                    }
                                    handleTaskComplete(taskId, completed);
                                  }}
                                  onRemoveFromAgenda={removeFromAgenda}
                                  isManualMode={sortOption === "manual"}
                                  showRemove={!task.isAutoAdded}
                                />
                              ))
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </Card>

                    <CompletedTasksSection
                      tasks={completedTasks}
                      onTaskClick={(id: string) => {
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
                      const originalId = id.includes('::') ? id.split('::')[0] : id;
                      setSelectedTaskId(originalId);
                      setTaskDialogOpen(true);
                    }}
                  />
                )}
              </>
            )}
          </div>

          {/* Available Tasks Pool - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-md font-semibold">
                Available Tasks
                <span className="text-muted-foreground font-normal ml-2">({availableTasks.length})</span>
              </h2>
            </div>
            
            <AgendaTaskPool
              tasks={availableTasks}
              onAddToAgenda={addToAgenda}
              onTaskClick={(id) => {
                setSelectedTaskId(id);
                setTaskDialogOpen(true);
              }}
              isAdding={isAdding}
            />
          </div>
        </div>
      </div>

      {/* Task Dialogs */}
      <UnifiedTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        taskId={selectedTaskId}
        mode="view"
      />
      
      <UnifiedTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        mode="create"
      />
    </div>
  );
}
