import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useUserAgenda } from "@/hooks/useUserAgenda";
import { useQueryClient } from "@tanstack/react-query";
import { UnifiedTaskDialog } from "@/components/UnifiedTaskDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, GripVertical, RotateCcw, Plus, AlertTriangle, Trash2, Check, Table, LayoutGrid, GanttChart, ChevronDown, ChevronRight, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DateRangePicker, DateRange } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";
import { getRecurrenceLabel } from "@/lib/recurrenceExpander";
import { useToast } from "@/hooks/use-toast";
import { isTaskOverdue } from "@/lib/overdueHelpers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Sortable Task Item Component - Clean single row with design system tokens
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

  const isOverdue = task.due_at && new Date(task.due_at) < new Date() && task.status !== 'Completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 py-3 px-4 transition-smooth cursor-pointer group border-b border-border last:border-0",
        "hover:bg-card-hover",
        isDragging && "z-50 bg-card shadow-lg rounded-xl border-2 border-dashed border-primary",
        isSelected && "bg-primary/5",
        isOverdue && "border-l-4 border-l-destructive"
      )}
      onClick={() => onTaskClick(task.id)}
    >
      {onSelect && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(task.id)}
          onClick={(e) => e.stopPropagation()}
          className="border-border"
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
        className="border-border"
      />
      
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={cn(
          "text-[14px] font-medium text-foreground truncate",
          task.status === 'Completed' && "line-through text-muted-foreground"
        )}>
          {task.title}
        </span>
        <Badge variant="outline" className={cn(
          "text-[10px] px-1.5 py-0 flex-shrink-0 rounded-full",
          task.priority === 'High' && 'border-destructive/50 text-destructive bg-destructive/10',
          task.priority === 'Medium' && 'border-primary/50 text-primary bg-primary/10',
          task.priority === 'Low' && 'border-border text-muted-foreground bg-muted'
        )}>
          {task.priority}
        </Badge>
        {(task.isRecurringOccurrence || task.task_type === 'recurring' || task.recurrence_rrule) && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 border-primary/30 text-primary flex-shrink-0 rounded-full">
            <RotateCcw className="h-2.5 w-2.5 mr-1" />
            {getRecurrenceLabel(task)}
          </Badge>
        )}
        {task.isAutoAdded && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted border-border text-muted-foreground flex-shrink-0 rounded-full">
            Auto
          </Badge>
        )}
        {task.due_at && (
          <span className={cn(
            "text-[12px] flex-shrink-0",
            isOverdue ? "text-destructive" : "text-muted-foreground"
          )}>
            {isOverdue ? "Overdue: " : ""}{format(new Date(task.due_at), 'MMM d')}
          </span>
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
          className="opacity-0 group-hover:opacity-100"
          title="Remove from agenda"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </Button>
      )}
    </div>
  );
}

// Task Pool Item - combined for overdue and available with design system tokens
function TaskPoolItem({ task, onTaskClick, onAdd, isOverdue = false }: any) {
  const isRecurring = task.task_type === 'recurring' || task.recurrence_rrule;
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-3 px-4 transition-smooth cursor-pointer group border-b border-border last:border-0",
        "hover:bg-card-hover",
        isOverdue && "bg-destructive/5 border-l-4 border-l-destructive"
      )}
      onClick={() => onTaskClick(task.id)}
    >
      {isOverdue && (
        <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-foreground font-medium truncate">{task.title}</span>
          {isRecurring && (
            <RotateCcw className="h-3 w-3 text-primary flex-shrink-0" />
          )}
        </div>
        {task.due_at && (
          <span className={cn(
            "text-[12px]",
            isOverdue ? "text-destructive" : "text-muted-foreground"
          )}>
            {isOverdue ? "Overdue: " : "Due: "}{format(new Date(task.due_at), 'MMM d')}
          </span>
        )}
      </div>
      <Badge variant="outline" className={cn(
        "text-[10px] px-1.5 py-0 flex-shrink-0 rounded-full",
        task.priority === 'High' && 'border-destructive/50 text-destructive bg-destructive/10',
        task.priority === 'Medium' && 'border-primary/50 text-primary bg-primary/10',
        task.priority === 'Low' && 'border-border text-muted-foreground bg-muted'
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
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 h-7 w-7"
          title="Add to agenda"
        >
          <Plus className="h-4 w-4 text-primary" />
        </Button>
      )}
    </div>
  );
}

// Kanban Card Component
function KanbanCard({ task, onTaskClick }: any) {
  return (
    <Card
      className="p-3 cursor-pointer hover:bg-card-hover hover:shadow-md transition-smooth"
      onClick={() => onTaskClick(task.id)}
    >
      <h4 className="text-body-sm font-medium line-clamp-2 mb-2">{task.title}</h4>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={cn(
          "text-[10px] px-1.5 py-0",
          task.priority === 'High' && 'border-destructive text-destructive',
          task.priority === 'Medium' && 'border-primary text-primary',
          task.priority === 'Low' && 'border-border text-muted-foreground'
        )}>
          {task.priority}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {task.status}
        </Badge>
      </div>
    </Card>
  );
}

export default function CalendarView() {
  document.title = "Agenda - Prisma";
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const { data: allTasks, isLoading } = useTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [dateView, setDateView] = useState<"today" | "tomorrow" | "week" | "custom">("today");
  const [viewMode, setViewMode] = useState<"table" | "kanban" | "gantt">("table");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [sortOption, setSortOption] = useState<string>(() => {
    return localStorage.getItem("agenda-sort") || "priority";
  });
  const [userTaskOrder, setUserTaskOrder] = useState<Record<string, number>>({});
  const [completions, setCompletions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const currentDate = new Date();
  const { toast } = useToast();

  // Fetch all users for admin filter
  useEffect(() => {
    if (userRole === 'admin') {
      const fetchUsers = async () => {
        const { data } = await supabase.from('profiles').select('user_id, name, email').order('name');
        setAllUsers(data || []);
      };
      fetchUsers();
    }
  }, [userRole]);

  // Calculate the selected date for agenda
  const selectedDate = useMemo(() => {
    switch (dateView) {
      case "tomorrow": return addDays(new Date(), 1);
      default: return dateRange?.from || new Date();
    }
  }, [dateView, dateRange]);

  // Determine which user's agenda to show
  const targetUserId = selectedUserId || user?.id;

  // Use the agenda hook
  const { 
    agendaTasks, 
    availableTasks, 
    agendaItems,
    addToAgenda, 
    removeFromAgenda,
    isLoading: agendaLoading 
  } = useUserAgenda({
    userId: targetUserId,
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
    if (sortOption === 'manual' && targetUserId) {
      fetchUserTaskOrder();
    }
  }, [sortOption, dateView, dateRange, targetUserId]);

  const fetchUserTaskOrder = async () => {
    if (!targetUserId) return;

    let dateScope: string = dateView;
    if (dateView === 'custom' && dateRange?.from) {
      dateScope = `custom-${format(dateRange.from, 'yyyy-MM-dd')}`;
    }

    const { data, error } = await supabase
      .from('user_task_order')
      .select('task_id, order_index')
      .eq('user_id', targetUserId)
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

  // Compute overdue tasks - filter by assignment for the selected user
  const overdueTasks = useMemo(() => {
    const allOverdue = (allTasks || []).filter(task => isTaskOverdue(task));
    
    // Filter to only show overdue tasks assigned to the target user (the user whose agenda we're viewing)
    return allOverdue.filter(task => {
      if (!task.assignees || task.assignees.length === 0) return false;
      return task.assignees.some((a: any) => a.user_id === targetUserId);
    });
  }, [allTasks, targetUserId]);

  // Weekly kanban columns by day
  const weeklyKanbanColumns = useMemo(() => {
    if (dateView !== 'week') return [];
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    
    return days.map((day, index) => {
      const dayDate = addDays(weekStart, index);
      const dayTasks = (allTasks || []).filter(t => {
        if (!t.due_at) return false;
        return isSameDay(new Date(t.due_at), dayDate);
      });
      return { day, date: dayDate, tasks: dayTasks };
    });
  }, [dateView, allTasks, currentDate]);

  // Daily kanban columns by priority
  const dailyKanbanColumns = useMemo(() => {
    if (dateView === 'week') return [];
    const priorities = ['High', 'Medium', 'Low'];
    return priorities.map(priority => ({
      priority,
      tasks: activeTasks.filter(t => t.priority === priority)
    }));
  }, [dateView, activeTasks]);

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
    
    if (!over || active.id === over.id || !targetUserId) return;

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
          user_id: targetUserId,
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

  // Combined task pool (overdue + available)
  const taskPoolCount = overdueTasks.length + availableTasks.length;

  // Show Task Pool only for non-week views
  const showTaskPool = dateView !== 'week';

  const openTaskDialog = (id: string) => {
    const originalId = id.includes('::') ? id.split('::')[0] : id;
    setSelectedTaskId(originalId);
    setTaskDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 pt-8 pb-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[24px] font-semibold text-foreground tracking-tight">My Agenda</h1>
              <p className="text-[14px] text-muted-foreground mt-1">{getDateLabel()}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Admin User Filter */}
              {userRole === 'admin' && (
                <Select value={selectedUserId || user?.id || ''} onValueChange={(v) => setSelectedUserId(v === user?.id ? null : v)}>
                  <SelectTrigger className="w-[200px] h-10 rounded-xl bg-card border-border text-[14px]">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="View user agenda" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-popover border-border shadow-lg">
                    {allUsers.map(u => (
                      <SelectItem key={u.user_id} value={u.user_id} className="rounded-lg">
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={() => setCreateTaskOpen(true)} className="rounded-full px-6 h-10 gap-2 shadow-sm text-[14px] font-medium">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>

          {/* Date Tabs + View Options */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Tabs value={dateView} onValueChange={(v) => {
                setDateView(v as typeof dateView);
                if (v !== "custom") setDateRange(null);
              }}>
                <TabsList className="h-10 rounded-xl bg-muted p-1">
                  <TabsTrigger value="today" className="h-8 px-4 rounded-lg text-[13px] data-[state=active]:bg-card data-[state=active]:shadow-sm">Today</TabsTrigger>
                  <TabsTrigger value="tomorrow" className="h-8 px-4 rounded-lg text-[13px] data-[state=active]:bg-card data-[state=active]:shadow-sm">Tomorrow</TabsTrigger>
                  <TabsTrigger value="week" className="h-8 px-4 rounded-lg text-[13px] data-[state=active]:bg-card data-[state=active]:shadow-sm">Week</TabsTrigger>
                  <TabsTrigger value="custom" className="h-8 px-4 rounded-lg text-[13px] data-[state=active]:bg-card data-[state=active]:shadow-sm">Custom</TabsTrigger>
                </TabsList>
              </Tabs>

              {dateView === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 px-4 rounded-xl text-[13px] border-border">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Pick date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-border" align="start">
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

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('table')}
                title="Table view"
                className={cn("h-8 w-8 rounded-lg", viewMode !== 'table' && "text-muted-foreground")}
              >
                <Table className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('kanban')}
                title="Kanban view"
                className={cn("h-8 w-8 rounded-lg", viewMode !== 'kanban' && "text-muted-foreground")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'gantt' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('gantt')}
                title="Gantt view"
                className={cn("h-8 w-8 rounded-lg", viewMode !== 'gantt' && "text-muted-foreground")}
              >
                <GanttChart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        {viewMode === 'kanban' ? (
          // Kanban View
          <div className="space-y-4">
            {dateView === 'week' ? (
              // Weekly Kanban - Group by Days
              <div className="grid grid-cols-5 gap-4">
                {weeklyKanbanColumns.map(col => (
                  <Card key={col.day} className="min-h-[500px]">
                    <div className="p-3 border-b border-border bg-muted/50">
                      <h3 className="font-semibold text-body-sm">{col.day}</h3>
                      <p className="text-metadata text-muted-foreground">{format(col.date, 'MMM d')}</p>
                    </div>
                    <ScrollArea className="h-[450px] p-3">
                      <div className="space-y-2">
                        {col.tasks.length === 0 ? (
                          <p className="text-metadata text-muted-foreground text-center py-4">No tasks</p>
                        ) : (
                          col.tasks.map(task => (
                            <KanbanCard key={task.id} task={task} onTaskClick={openTaskDialog} />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                ))}
              </div>
            ) : (
              // Daily Kanban - Group by Priority
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-3 gap-4">
                    {dailyKanbanColumns.map(col => (
                      <Card key={col.priority} className="min-h-[400px]">
                        <div className={cn(
                          "p-3 border-b border-border",
                          col.priority === 'High' && "bg-destructive/10",
                          col.priority === 'Medium' && "bg-primary/10",
                          col.priority === 'Low' && "bg-muted/50"
                        )}>
                          <h3 className="font-semibold text-body-sm">{col.priority} Priority</h3>
                          <p className="text-metadata text-muted-foreground">{col.tasks.length} tasks</p>
                        </div>
                        <ScrollArea className="h-[350px] p-3">
                          <div className="space-y-2">
                            {col.tasks.length === 0 ? (
                              <p className="text-metadata text-muted-foreground text-center py-4">No tasks</p>
                            ) : (
                              col.tasks.map(task => (
                                <KanbanCard key={task.id} task={task} onTaskClick={openTaskDialog} />
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Task Pool for Daily Kanban */}
                {showTaskPool && (
                  <div className="lg:col-span-1">
                    <Card>
                      <div className="p-3 border-b border-border">
                        <h3 className="text-body-sm font-semibold flex items-center gap-2">
                          Task Pool
                          <Badge variant="secondary" className="text-xs">{taskPoolCount}</Badge>
                        </h3>
                      </div>
                      <ScrollArea className="max-h-[450px]">
                        {overdueTasks.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-destructive/10 flex items-center gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                              <span className="text-metadata font-medium text-destructive">Overdue ({overdueTasks.length})</span>
                            </div>
                            {overdueTasks.map(task => (
                              <TaskPoolItem key={task.id} task={task} isOverdue onTaskClick={openTaskDialog} onAdd={addToAgenda} />
                            ))}
                          </div>
                        )}
                        {availableTasks.length > 0 && (
                          <div>
                            <div className="px-3 py-2 bg-muted/50 flex items-center gap-2">
                              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-metadata font-medium text-muted-foreground">Available ({availableTasks.length})</span>
                            </div>
                            {availableTasks.map(task => (
                              <TaskPoolItem key={task.id} task={task} onTaskClick={openTaskDialog} onAdd={addToAgenda} />
                            ))}
                          </div>
                        )}
                        {taskPoolCount === 0 && (
                          <div className="p-4 text-center">
                            <p className="text-metadata text-muted-foreground">All caught up!</p>
                          </div>
                        )}
                      </ScrollArea>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : viewMode === 'gantt' ? (
          // Gantt View Placeholder
          <Card className="p-8 text-center">
            <GanttChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-heading-sm font-semibold mb-2">Gantt View</h3>
            <p className="text-muted-foreground">Gantt chart visualization coming soon</p>
          </Card>
        ) : (
          // Table View (Default)
          <div className={cn("grid gap-6", showTaskPool ? "grid-cols-1 lg:grid-cols-[1fr_380px]" : "grid-cols-1")}>
            {/* My Agenda - Main column */}
            <div>
              <Card className="bg-card border-border rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={selectedIds.size === activeTasks.length && activeTasks.length > 0}
                      onCheckedChange={selectAll}
                      className="border-border"
                    />
                    <span className="text-[14px] text-muted-foreground">
                      {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${activeTasks.length} tasks`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                      <>
                        <Button variant="outline" size="sm" onClick={handleBulkComplete} className="rounded-lg h-8 text-[13px]">
                          <Check className="h-4 w-4 mr-1.5" />
                          Complete
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleBulkRemove} className="rounded-lg h-8 text-[13px]">
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Remove
                        </Button>
                      </>
                    )}
                    
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="h-8 px-3 text-[13px] bg-muted border-0 rounded-lg text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                      <div>
                        {activeTasks.length === 0 ? (
                          <div className="p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-[16px] font-medium text-foreground mb-1">No tasks in your agenda</p>
                            <p className="text-[14px] text-muted-foreground">
                              {showTaskPool ? "Add tasks from the Task Pool →" : "Create a new task to get started"}
                            </p>
                          </div>
                        ) : (
                          activeTasks.map((task) => (
                            <SortableTaskItem
                              key={task.id}
                              task={task}
                              onTaskClick={openTaskDialog}
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

                {/* Completed Section - Collapsible */}
                {completedTasks.length > 0 && (
                  <Collapsible open={completedExpanded} onOpenChange={setCompletedExpanded}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-smooth">
                        {completedExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-[14px] font-medium text-muted-foreground">
                          Completed Today ({completedTasks.length})
                        </span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="bg-muted/10">
                        {completedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 py-3 px-4 border-b border-border last:border-0 cursor-pointer hover:bg-muted/20 transition-smooth"
                            onClick={() => openTaskDialog(task.id)}
                          >
                            <Checkbox checked disabled className="opacity-50 border-border" />
                            <span className="text-[14px] text-muted-foreground line-through">{task.title}</span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </Card>
            </div>

            {/* Task Pool - 25% - Only shown for non-week views */}
            {showTaskPool && (
              <div className="lg:col-span-1 min-w-[320px]">
                <Card className="bg-card border-border rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="p-4 border-b border-border bg-card">
                    <h3 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
                      Task Pool
                      <Badge variant="secondary" className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {taskPoolCount}
                      </Badge>
                    </h3>
                    <p className="text-[12px] text-muted-foreground mt-1">Add tasks to your agenda</p>
                  </div>
                  
                  <ScrollArea className="max-h-[calc(100vh-350px)]">
                    {/* Overdue Section */}
                    {overdueTasks.length > 0 && (
                      <div>
                        <div className="px-4 py-2.5 bg-destructive/5 flex items-center gap-2 border-b border-destructive/10">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="text-[12px] font-semibold text-destructive uppercase tracking-wide">
                            Overdue ({overdueTasks.length})
                          </span>
                        </div>
                        {overdueTasks.map(task => (
                          <TaskPoolItem 
                            key={task.id}
                            task={task}
                            isOverdue
                            onTaskClick={openTaskDialog}
                            onAdd={addToAgenda}
                          />
                        ))}
                      </div>
                    )}

                    {/* Available Section */}
                    {availableTasks.length > 0 && (
                      <div>
                        <div className="px-4 py-2.5 bg-muted/30 flex items-center gap-2 border-b border-border">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Available ({availableTasks.length})
                          </span>
                        </div>
                        {availableTasks.map(task => (
                          <TaskPoolItem 
                            key={task.id}
                            task={task}
                            onTaskClick={openTaskDialog}
                            onAdd={addToAgenda}
                          />
                        ))}
                      </div>
                    )}

                    {taskPoolCount === 0 && (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                          <Check className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-[14px] font-medium text-foreground">All caught up!</p>
                        <p className="text-[12px] text-muted-foreground mt-1">No pending tasks to add</p>
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </div>
            )}
          </div>
        )}
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
