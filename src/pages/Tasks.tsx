import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Plus, ListTodo, AlertCircle, Clock, Shield, TrendingUp, List, LayoutGrid, Columns3, X, CheckCircle2, ChevronUp, ChevronDown, SlidersHorizontal, Calendar, RefreshCw } from "lucide-react";
import { TasksTable } from "@/components/TasksTable";
import { TasksTableVirtualized } from "@/components/TasksTableVirtualized";
import { UnifiedTaskDialog } from "@/components/UnifiedTaskDialog";
import { TaskTemplateDialog } from "@/components/TaskTemplateDialog";
import { AssigneeFilterBar } from "@/components/AssigneeFilterBar";
import { TaskDateFilterBar } from "@/components/TaskDateFilterBar";
import { StatusMultiSelect } from "@/components/tasks/StatusMultiSelect";

import { TaskGridView } from "@/components/tasks/TaskGridView";
import { TaskBoardView } from "@/components/tasks/TaskBoardView";
import { FilteredTasksDialog } from "@/components/tasks/FilteredTasksDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { addDays } from "date-fns";
import { cn } from "@/lib/utils";
// Removed - using UnifiedTaskDialog
import { useTasks } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CardSkeleton } from "@/components/skeletons/CardSkeleton";
import { TaskBulkActionsBar } from "@/components/tasks/TaskBulkActionsBar";
import { exportTasksToCSV } from "@/lib/taskExport";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { isTaskOverdue } from "@/lib/overdueHelpers";

export default function Tasks() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<any>(null);
  const [statusFilters, setStatusFilters] = useState<string[]>(['Pending', 'Ongoing', 'Blocked', 'Failed']);
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'kanban-status' | 'kanban-date'>('table');
  const [boardGroupBy, setBoardGroupBy] = useState<'status' | 'date'>('status');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [filteredDialogOpen, setFilteredDialogOpen] = useState(false);
  const [filteredDialogType, setFilteredDialogType] = useState<'all' | 'overdue' | 'ongoing' | 'completed'>('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [hideRecurring, setHideRecurring] = useState(true);
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    const saved = localStorage.getItem('tasksItemsPerPage');
    if (saved) setItemsPerPage(Number(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasksItemsPerPage', String(itemsPerPage));
  }, [itemsPerPage]);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskDialogOpen(true);
  };

  const { data, isLoading, refetch } = useTasks();

  const quickFilters = [
    {
      label: "Overdue",
      Icon: AlertCircle,
      filter: (task: any) => isTaskOverdue(task),
      clearOtherFilters: true
    },
    {
      label: "Due Soon",
      Icon: Clock,
      filter: (task: any) => {
        if (!task.due_at) return false;
        const dueDate = new Date(task.due_at);
        const threeDaysFromNow = addDays(new Date(), 3);
        return dueDate <= threeDaysFromNow && dueDate >= new Date() && task.status !== 'Completed';
      }
    },
    {
      label: "Blocked",
      Icon: Shield,
      filter: (task: any) => task.status === 'Blocked'
    },
    {
      label: "High Priority",
      Icon: TrendingUp,
      filter: (task: any) => task.priority === 'High' && task.status !== 'Completed'
    }
  ];

  const filteredTasks = useMemo(() => {
    return (data || []).filter((task: any) => {
      const assigneeMatch = selectedAssignees.length === 0 || 
        task.assignees?.some((assignee: any) => selectedAssignees.includes(assignee.user_id));
      
      let dateMatch = true;
      if (dateFilter) {
        if (!task.due_at) {
          dateMatch = dateFilter.label === "Backlog";
        } else {
          const dueDate = new Date(task.due_at);
          dateMatch = dueDate >= dateFilter.startDate && dueDate <= dateFilter.endDate;
        }
      }
      
      const statusMatch = statusFilters.length === 0 || statusFilters.includes(task.status);
      
      const tagsMatch = selectedTags.length === 0 || 
        selectedTags.some(tag => task.labels?.includes(tag));
      
      const searchMatch = debouncedSearch === "" || 
        task.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
      
      const recurringMatch = !hideRecurring || task.task_type !== 'recurring';
      
      return assigneeMatch && dateMatch && statusMatch && tagsMatch && searchMatch && recurringMatch;
    });
  }, [data, selectedAssignees, dateFilter, statusFilters, selectedTags, debouncedSearch, hideRecurring]);

  const finalFilteredTasks = useMemo(() => {
    if (activeQuickFilter) {
      const quickFilterDef = quickFilters.find(f => f.label === activeQuickFilter);
      if (quickFilterDef) {
        return filteredTasks.filter(quickFilterDef.filter);
      }
    }
    return filteredTasks;
  }, [filteredTasks, activeQuickFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAssignees, dateFilter, statusFilters, selectedTags, debouncedSearch, activeQuickFilter]);

  const tasks = data || [];
  const hasActiveFilters = selectedAssignees.length > 0 || selectedTags.length > 0 || dateFilter || statusFilters.length !== 4 || activeQuickFilter || searchQuery;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const clearAllFilters = () => {
    setSelectedAssignees([]);
    setSelectedTags([]);
    setDateFilter(null);
    setStatusFilters(['Pending', 'Ongoing', 'Blocked', 'Failed']);
    setActiveQuickFilter(null);
    setSearchQuery("");
    setSelectedTaskIds([]);
  };

  const handleQuickFilter = (filterLabel: string) => {
    const filter = quickFilters.find(f => f.label === filterLabel);
    
    if (activeQuickFilter === filterLabel) {
      setActiveQuickFilter(null);
    } else {
      // If this filter needs to clear others (e.g., Overdue), clear all filters first
      if (filter?.clearOtherFilters) {
        clearAllFilters();
      }
      setActiveQuickFilter(filterLabel);
    }
  };

  const handleBulkComplete = async () => {
    await Promise.all(selectedTaskIds.map(id => supabase.from('tasks').update({ status: 'Completed' }).eq('id', id)));
    setSelectedTaskIds([]);
    refetch();
  };

  const handleBulkStatusChange = async (status: string) => {
    await Promise.all(selectedTaskIds.map(id => 
      supabase.from('tasks').update({ status: status as any }).eq('id', id)
    ));
    setSelectedTaskIds([]);
    refetch();
  };

  const handleBulkPriorityChange = async (priority: string) => {
    await Promise.all(selectedTaskIds.map(id => 
      supabase.from('tasks').update({ priority: priority as any }).eq('id', id)
    ));
    setSelectedTaskIds([]);
    refetch();
  };

  const handleBulkDelete = async () => {
    await Promise.all(selectedTaskIds.map(id => supabase.from('tasks').delete().eq('id', id)));
    setSelectedTaskIds([]);
    refetch();
  };

  const handleBulkExport = () => {
    const selectedTasks = finalFilteredTasks.filter(t => selectedTaskIds.includes(t.id));
    exportTasksToCSV(selectedTasks);
  };

  return (
    <div className="theme-apple min-h-screen bg-background px-6 md:px-12 py-8 space-y-6 relative">
      <TaskBulkActionsBar
        selectedCount={selectedTaskIds.length}
        onClearSelection={() => setSelectedTaskIds([])}
        onComplete={handleBulkComplete}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
        onPriorityChange={handleBulkPriorityChange}
        onExport={handleBulkExport}
      />
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Apple-style Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-semibold tracking-tight text-foreground">Tasks</h1>
            <p className="text-[15px] text-muted-foreground mt-1">Manage and track your team's tasks</p>
          </div>
          <Button 
            onClick={() => setDialogOpen(true)} 
            className="rounded-full px-6 h-11 shadow-sm hover:shadow-md transition-all font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Apple-style Filter Bar */}
        <Card className="p-3 rounded-2xl border-border/50 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 md:w-64 h-9 rounded-full bg-muted/50 border-0 px-4 text-[14px] placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            
            <StatusMultiSelect
              value={statusFilters}
              onChange={setStatusFilters}
            />
            
            <Select
              value={selectedTags.length > 0 ? "selected" : "all"}
              onValueChange={(value) => {
                if (value === "all") setSelectedTags([]);
              }}
            >
              <SelectTrigger className="w-[100px] h-9 rounded-full bg-muted/50 border-0 text-[13px]">
                <SelectValue>
                  {selectedTags.length > 0 ? `${selectedTags.length} tags` : "Tags"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Tags</SelectItem>
                {['urgent', 'review', 'bug', 'feature', 'docs'].map((tag) => (
                  <div
                    key={tag}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedTags(prev => 
                        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                      );
                    }}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 rounded-lg text-[13px]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => {}}
                      className="cursor-pointer rounded"
                    />
                    <span className="capitalize">{tag}</span>
                  </div>
                ))}
              </SelectContent>
            </Select>

            <AssigneeFilterBar
              selectedAssignees={selectedAssignees}
              onAssigneesChange={setSelectedAssignees}
            />
            
            <TaskDateFilterBar
              value={dateFilter ? { from: dateFilter.startDate, to: dateFilter.endDate } : null}
              onFilterChange={setDateFilter}
              onStatusChange={() => {}}
              selectedStatus="all"
            />

            <Button
              variant={hideRecurring ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => setHideRecurring(!hideRecurring)}
              className="h-9 text-[12px] rounded-full px-4 border-0 bg-muted/50"
              title={hideRecurring ? "Show recurring tasks" : "Hide recurring tasks"}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              {hideRecurring ? "Show Recurring" : "Hide Recurring"}
            </Button>

            <div className="ml-auto flex gap-1.5 flex-shrink-0 bg-muted/50 p-1 rounded-full">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={cn("h-8 w-8 p-0 rounded-full", viewMode === 'table' && "shadow-sm")}
                title="Table"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn("h-8 w-8 p-0 rounded-full", viewMode === 'grid' && "shadow-sm")}
                title="Grid"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban-status' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setViewMode('kanban-status');
                  setBoardGroupBy('status');
                }}
                className={cn("h-8 w-8 p-0 rounded-full", viewMode === 'kanban-status' && "shadow-sm")}
                title="Kanban Status"
              >
                <Columns3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban-date' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setViewMode('kanban-date');
                  setBoardGroupBy('date');
                }}
                className={cn("h-8 w-8 p-0 rounded-full", viewMode === 'kanban-date' && "shadow-sm")}
                title="Kanban Date"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {hasActiveFilters && (
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 text-[12px] text-muted-foreground hover:text-foreground rounded-full px-4"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear All Filters
            </Button>
            <span className="text-[12px] text-muted-foreground">
              Showing {finalFilteredTasks.length} of {data?.length || 0} tasks
            </span>
          </div>
        )}

      {/* Overdue Tasks Alert - Apple style */}
      {finalFilteredTasks.filter(task => isTaskOverdue(task)).length > 0 && (
        <Card className="p-4 rounded-2xl border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-[14px] font-medium text-destructive">
              You have {finalFilteredTasks.filter(task => isTaskOverdue(task)).length} overdue tasks that need attention
            </span>
          </div>
        </Card>
      )}

      {/* Task Views */}
      {finalFilteredTasks.length === 0 ? (
        <div className="py-16 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-primary/10 p-8 rounded-full mb-6">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-[22px] font-semibold text-foreground mb-2">All Clear!</h2>
            <p className="text-[15px] text-muted-foreground mb-8 max-w-sm leading-relaxed">
              {tasks.length === 0 
                ? "You don't have any tasks yet. Create your first task to get started."
                : "No tasks found matching your filters. Try adjusting your search."}
            </p>
            {tasks.length === 0 && (
              <Button 
                size="lg" 
                onClick={() => setDialogOpen(true)}
                className="rounded-full px-8 h-12 shadow-sm hover:shadow-md"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Task
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Apple-style Pagination Controls */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, finalFilteredTasks.length)}-{Math.min(currentPage * itemsPerPage, finalFilteredTasks.length)} of {finalFilteredTasks.length} tasks
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-muted-foreground">Items per page:</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[80px] h-9 rounded-full bg-muted/50 border-0 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Paginated Task Views */}
          {(() => {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginatedTasks = finalFilteredTasks.slice(startIndex, startIndex + itemsPerPage);
            const totalPages = Math.ceil(finalFilteredTasks.length / itemsPerPage);

            return (
              <>
                {viewMode === 'table' && (
                  finalFilteredTasks.length > 100 ? (
                    <TasksTableVirtualized tasks={finalFilteredTasks} onTaskUpdate={refetch} />
                  ) : (
                    <TasksTable 
                      tasks={paginatedTasks} 
                      onTaskUpdate={refetch}
                      selectedIds={selectedTaskIds}
                      onSelectionChange={setSelectedTaskIds}
                    />
                  )
                )}
                {viewMode === 'grid' && <TaskGridView tasks={paginatedTasks} onTaskClick={handleTaskClick} />}
                {(viewMode === 'kanban-status' || viewMode === 'kanban-date') && (
                  <TaskBoardView 
                    tasks={finalFilteredTasks} 
                    onTaskClick={handleTaskClick}
                    groupBy={boardGroupBy}
                  />
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            );
          })()}
        </>
      )}

      <UnifiedTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} mode="create" />
      {selectedTaskId && (
        <UnifiedTaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          mode="view"
          taskId={selectedTaskId}
        />
      )}
      
      {/* Filtered Tasks Dialog */}
      <FilteredTasksDialog
        open={filteredDialogOpen}
        onOpenChange={setFilteredDialogOpen}
        filterType={filteredDialogType}
        tasks={(() => {
          if (filteredDialogType === 'overdue') {
            return tasks.filter((t: any) => t.due_at && new Date(t.due_at) < new Date() && t.status !== 'Completed');
          } else if (filteredDialogType === 'ongoing') {
            return tasks.filter((t: any) => t.status === 'Ongoing');
          } else if (filteredDialogType === 'completed') {
            return tasks.filter((t: any) => t.status === 'Completed');
          }
          return tasks;
        })()}
        onRefresh={refetch}
      />
      </div>
    </div>
  );
}
