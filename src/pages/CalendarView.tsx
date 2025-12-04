import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useUserAgenda } from "@/hooks/useUserAgenda";
import { useQueryClient } from "@tanstack/react-query";
import { UnifiedTaskDialog } from "@/components/UnifiedTaskDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { format, addDays, startOfWeek } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, GripVertical, RotateCcw, Plus, AlertTriangle, Trash2, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { CompletedTasksSection } from "@/components/tasks/CompletedTasksSection";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";
import { expandRecurringTask, getRecurrenceLabel } from "@/lib/recurrenceExpander";
import { useToast } from "@/hooks/use-toast";
import { isTaskOverdue, getDaysOverdue } from "@/lib/overdueHelpers";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sortable Task Item Component
function SortableTaskItem({ task, onTaskClick, onTaskComplete, onRemoveFromAgenda, isManualMode = false, showRemove = false, isSelected, onSelect }: any) {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 py-3 px-2 hover:bg-muted/50 transition-smooth cursor-pointer group",
        isDragging && "z-50 bg-background shadow-lg rounded-lg border-2 border-dashed border-primary",
        isSelected && "bg-primary/5"
      )}
      onClick={() => onTaskClick(task.id)}
    >
      {onSelect && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(task.id)}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      
      {isManualMode && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      
      <Checkbox
        checked={task.status === 'Completed'}
        onCheckedChange={(checked) => onTaskComplete(task.id, checked as boolean)}
        onClick={(e) => e.stopPropagation()}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "text-body-sm font-medium truncate",
            task.status === 'Completed' && "line-through text-muted-foreground"
          )}>
            {task.title}
          </span>
          <Badge variant="outline" className={cn(
            "text-[10px] px-1.5 py-0",
            task.priority === 'High' && 'border-destructive text-destructive',
            task.priority === 'Medium' && 'border-primary text-primary',
            task.priority === 'Low' && 'border-border text-muted-foreground'
          )}>
            {task.priority}
          </Badge>
          {task.isRecurringOccurrence && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 border-primary/30">
              <RotateCcw className="h-2.5 w-2.5 mr-1" />
              {getRecurrenceLabel(task)}
            </Badge>
          )}
          {task.isAutoAdded && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted">
              Auto
            </Badge>
          )}
        </div>
      </div>
      
      {showRemove && onRemoveFromAgenda && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromAgenda([task.id]);
          }}
          className="opacity-0 group-hover:opacity-100"
          title="Remove from agenda"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </Button>
      )}
    </div>
  );
}

// Compact task item for sidebar
function CompactTaskItem({ task, onTaskClick, onAdd }: any) {
  return (
    <div
      className="flex items-center gap-2 py-2 px-2 hover:bg-muted/50 transition-smooth cursor-pointer group"
      onClick={() => onTaskClick(task.id)}
    >
      <div className="flex-1 min-w-0">
        <span className="text-body-sm truncate block">{task.title}</span>
        {task.due_at && (
          <span className="text-metadata text-muted-foreground">
            Due: {format(new Date(task.due_at), 'MMM dd')}
          </span>
        )}
      </div>
      <Badge variant="outline" className={cn(
        "text-[9px] px-1 py-0 flex-shrink-0",
        task.priority === 'High' && 'border-destructive text-destructive',
        task.priority === 'Medium' && 'border-primary text-primary'
      )}>
        {task.priority}
      </Badge>
      {onAdd && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onAdd([task.id]);
          }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export default function CalendarView() {
  document.title = "Agenda - Prisma";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: allTasks, isLoading } = useTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [dateView, setDateView] = useState<"today" | "tomorrow" | "week" | "custom">("today");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [sortOption, setSortOption] = useState<string>(() => {
    return localStorage.getItem("agenda-sort") || "priority";
  });
  const [userTaskOrder, setUserTaskOrder] = useState<Record<string, number>>({});
  const [completions, setCompletions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const currentDate = new Date();
  const { toast } = useToast();

  // Calculate the selected date for agenda
  const selectedDate = useMemo(() => {
    switch (dateView) {
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
    userId: user?.id,
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

  // Compute overdue tasks
  const overdueTasks = useMemo(() => {
    return (allTasks || []).filter(task => isTaskOverdue(task));
  }, [allTasks]);

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
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
          toast({ title: "Marked complete", description: `Completed for ${format(occurrenceDate, 'MMM dd')}` });
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
        toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
      } else {
        toast({ title: completed ? "Task completed" : "Task reopened" });
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

  // Bulk actions
  const toggleSelection = (taskId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === activeTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeTasks.map(t => t.id)));
    }
  };

  const handleBulkComplete = async () => {
    for (const taskId of selectedIds) {
      await handleTaskComplete(taskId, true);
    }
    setSelectedIds(new Set());
  };

  const handleBulkRemove = () => {
    removeFromAgenda(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  // Get date label
  const getDateLabel = () => {
    switch (dateView) {
      case "today": return format(currentDate, 'EEEE, MMMM d');
      case "tomorrow": return format(addDays(currentDate, 1), 'EEEE, MMMM d');
      case "week": return `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')}`;
      case "custom": return dateRange?.from ? format(dateRange.from, 'MMMM d, yyyy') : 'Select date';
      default: return format(currentDate, 'EEEE, MMMM d');
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-page-title font-bold">My Agenda</h1>
              <p className="text-muted-foreground">{getDateLabel()}</p>
            </div>
            <Button onClick={() => setCreateTaskOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>

          {/* Date Tabs */}
          <div className="flex items-center gap-3">
            <Tabs value={dateView} onValueChange={(v) => {
              setDateView(v as typeof dateView);
              if (v !== "custom") setDateRange(null);
            }}>
              <TabsList className="h-9">
                <TabsTrigger value="today" className="h-8 px-3">Today</TabsTrigger>
                <TabsTrigger value="tomorrow" className="h-8 px-3">Tomorrow</TabsTrigger>
                <TabsTrigger value="week" className="h-8 px-3">Week</TabsTrigger>
                <TabsTrigger value="custom" className="h-8 px-3">Custom</TabsTrigger>
              </TabsList>
            </Tabs>

            {dateView === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Pick date
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateRangePicker
                    value={dateRange}
                    onChange={(range) => {
                      setDateRange(range);
                      if (range) setDateView("custom");
                    }}
                    presets="full"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </header>

        {/* Main Content - 70/30 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* My Agenda - 70% */}
          <div className="lg:col-span-7">
            <Card>
              {/* Toolbar */}
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={selectedIds.size === activeTasks.length && activeTasks.length > 0}
                    onCheckedChange={selectAll}
                  />
                  <span className="text-body-sm text-muted-foreground">
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${activeTasks.length} tasks`}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleBulkComplete}>
                        <Check className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleBulkRemove}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </>
                  )}
                  
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="h-8 px-2 text-body-sm bg-background border border-input rounded-md"
                  >
                    <option value="priority">Priority</option>
                    <option value="due_time">Due Date</option>
                    <option value="status">Status</option>
                    <option value="alphabetical">A-Z</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>

              {/* Task List */}
              {isLoading || agendaLoading ? (
                <div className="p-4">
                  <ListSkeleton items={5} />
                </div>
              ) : (
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
                    <div className="divide-y divide-border">
                      {activeTasks.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-muted-foreground mb-2">No tasks in your agenda</p>
                          <p className="text-metadata text-muted-foreground">Add tasks from the sidebar →</p>
                        </div>
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
                            onTaskComplete={handleTaskComplete}
                            onRemoveFromAgenda={removeFromAgenda}
                            isManualMode={sortOption === "manual"}
                            showRemove={!task.isAutoAdded}
                            isSelected={selectedIds.has(task.id)}
                            onSelect={toggleSelection}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Completed Section */}
              {completedTasks.length > 0 && (
                <CompletedTasksSection
                  tasks={completedTasks}
                  onTaskClick={(id: string) => {
                    const originalId = id.includes('::') ? id.split('::')[0] : id;
                    setSelectedTaskId(originalId);
                    setTaskDialogOpen(true);
                  }}
                  onTaskComplete={handleTaskComplete}
                />
              )}
            </Card>
          </div>

          {/* Right Sidebar - 30% */}
          <div className="lg:col-span-3 space-y-4">
            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
              <Card className="border-l-4 border-l-destructive">
                <div className="p-3 border-b border-border flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <h3 className="text-body-sm font-semibold text-destructive">
                    Overdue ({overdueTasks.length})
                  </h3>
                </div>
                <ScrollArea className="max-h-[200px]">
                  <div className="divide-y divide-border">
                    {overdueTasks.slice(0, 5).map(task => (
                      <CompactTaskItem 
                        key={task.id}
                        task={task}
                        onTaskClick={(id: string) => {
                          setSelectedTaskId(id);
                          setTaskDialogOpen(true);
                        }}
                        onAdd={addToAgenda}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}

            {/* Available Tasks */}
            <Card>
              <div className="p-3 border-b border-border flex items-center justify-between">
                <h3 className="text-body-sm font-semibold">
                  Available Tasks ({availableTasks.length})
                </h3>
              </div>
              {availableTasks.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-metadata text-muted-foreground">All tasks added to agenda</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div className="divide-y divide-border">
                    {availableTasks.map(task => (
                      <CompactTaskItem 
                        key={task.id}
                        task={task}
                        onTaskClick={(id: string) => {
                          setSelectedTaskId(id);
                          setTaskDialogOpen(true);
                        }}
                        onAdd={addToAgenda}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </Card>
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
