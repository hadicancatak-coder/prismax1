import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Plus, ListTodo, AlertCircle, Clock, Shield, TrendingUp, List, Columns3, X, CheckCircle2, RefreshCw, Tag, User, Layers } from "lucide-react";
import { TasksTable } from "@/components/TasksTable";
import { TasksTableVirtualized } from "@/components/TasksTableVirtualized";
import { UnifiedTaskDialog } from "@/components/UnifiedTaskDialog";
import { AssigneeFilterBar } from "@/components/AssigneeFilterBar";
import { TaskDateFilterBar } from "@/components/TaskDateFilterBar";
import { StatusMultiSelect } from "@/components/tasks/StatusMultiSelect";
import { TaskBoardView } from "@/components/tasks/TaskBoardView";
import { FilteredTasksDialog } from "@/components/tasks/FilteredTasksDialog";
import { PageContainer, PageHeader, DataCard, EmptyState, FilterBar } from "@/components/layout";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { TASK_TAGS } from "@/lib/constants";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { TaskBulkActionsBar } from "@/components/tasks/TaskBulkActionsBar";
import { exportTasksToCSV } from "@/lib/taskExport";
import { isTaskOverdue } from "@/lib/overdueHelpers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  completeTasksBulk, 
  setTasksStatusBulk, 
  deleteTasksBulk, 
  setPriorityBulk,
  addTaskComment 
} from "@/domain";

export default function Tasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<any>(null);
  const [statusFilters, setStatusFilters] = useState<string[]>(['Pending', 'Ongoing', 'Blocked', 'Failed']);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban-status' | 'kanban-date' | 'kanban-tags'>('table');
  const [boardGroupBy, setBoardGroupBy] = useState<'status' | 'date' | 'tags'>('status');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [filteredDialogOpen, setFilteredDialogOpen] = useState(false);
  const [filteredDialogType, setFilteredDialogType] = useState<'all' | 'overdue' | 'ongoing' | 'completed'>('all');
  const [hideRecurring, setHideRecurring] = useState(true);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [tableGroupBy, setTableGroupBy] = useState<'none' | 'dueDate' | 'priority' | 'assignee' | 'tags'>('none');
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
    { label: "Overdue", Icon: AlertCircle, filter: (task: any) => isTaskOverdue(task), clearOtherFilters: true },
    { label: "Due Soon", Icon: Clock, filter: (task: any) => { if (!task.due_at) return false; const dueDate = new Date(task.due_at); const threeDaysFromNow = addDays(new Date(), 3); return dueDate <= threeDaysFromNow && dueDate >= new Date() && task.status !== 'Completed'; }},
    { label: "Blocked", Icon: Shield, filter: (task: any) => task.status === 'Blocked' },
    { label: "High Priority", Icon: TrendingUp, filter: (task: any) => task.priority === 'High' && task.status !== 'Completed' }
  ];

  const filteredTasks = useMemo(() => {
    return (data || []).filter((task: any) => {
      // My Tasks filter
      if (showMyTasks && user) {
        const isMyTask = task.assignees?.some((assignee: any) => assignee.user_id === user.id);
        if (!isMyTask) return false;
      }
      
      const assigneeMatch = selectedAssignees.length === 0 || task.assignees?.some((assignee: any) => selectedAssignees.includes(assignee.user_id));
      let dateMatch = true;
      if (dateFilter) {
        if (!task.due_at) { dateMatch = dateFilter.label === "Backlog"; } 
        else { const dueDate = new Date(task.due_at); dateMatch = dueDate >= dateFilter.startDate && dueDate <= dateFilter.endDate; }
      }
      const statusMatch = statusFilters.length === 0 || statusFilters.includes(task.status);
      const tagsMatch = selectedTags.length === 0 || selectedTags.some(tag => task.labels?.includes(tag));
      const searchMatch = debouncedSearch === "" || task.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) || (task.description && task.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
      const recurringMatch = !hideRecurring || task.task_type !== 'recurring';
      return assigneeMatch && dateMatch && statusMatch && tagsMatch && searchMatch && recurringMatch;
    });
  }, [data, selectedAssignees, dateFilter, statusFilters, selectedTags, debouncedSearch, hideRecurring, showMyTasks, user]);

  const finalFilteredTasks = useMemo(() => {
    if (activeQuickFilter) {
      const quickFilterDef = quickFilters.find(f => f.label === activeQuickFilter);
      if (quickFilterDef) return filteredTasks.filter(quickFilterDef.filter);
    }
    return filteredTasks;
  }, [filteredTasks, activeQuickFilter]);

  useEffect(() => { setCurrentPage(1); }, [selectedAssignees, dateFilter, statusFilters, selectedTags, debouncedSearch, activeQuickFilter]);

  const tasks = data || [];
  const hasActiveFilters = selectedAssignees.length > 0 || selectedTags.length > 0 || dateFilter || statusFilters.length !== 4 || activeQuickFilter || searchQuery || showMyTasks;
  
  // Count my tasks for the button badge
  const myTasksCount = useMemo(() => {
    if (!user || !data) return 0;
    return data.filter((task: any) => 
      task.assignees?.some((assignee: any) => assignee.user_id === user.id) &&
      task.status !== 'Completed' && task.status !== 'Failed'
    ).length;
  }, [data, user]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  const clearAllFilters = () => {
    setSelectedAssignees([]); setSelectedTags([]); setDateFilter(null);
    setStatusFilters(['Pending', 'Ongoing', 'Blocked', 'Failed']);
    setActiveQuickFilter(null); setSearchQuery(""); setSelectedTaskIds([]);
    setShowMyTasks(false); setTableGroupBy('none');
  };

  const handleQuickFilter = (filterLabel: string) => {
    const filter = quickFilters.find(f => f.label === filterLabel);
    if (activeQuickFilter === filterLabel) { setActiveQuickFilter(null); } 
    else { if (filter?.clearOtherFilters) clearAllFilters(); setActiveQuickFilter(filterLabel); }
  };

  const handleBulkComplete = async () => {
    const result = await completeTasksBulk(selectedTaskIds);
    if (result.success) {
      toast({ title: `${result.successCount} task(s) completed`, duration: 2000 });
    } else {
      toast({ 
        title: "Some tasks failed to complete", 
        description: `${result.successCount} succeeded, ${result.failedCount} failed`,
        variant: "destructive" 
      });
    }
    setSelectedTaskIds([]);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const handleBulkStatusChange = async (status: string, blockedReason?: string) => {
    const result = await setTasksStatusBulk(selectedTaskIds, status, { blocked_reason: blockedReason });
    
    // Add comments for blocked tasks if reason provided
    if (blockedReason && user) {
      for (const id of selectedTaskIds) {
        await addTaskComment(id, user.id, `Blocked: ${blockedReason}`);
      }
    }
    
    if (result.success) {
      toast({ title: `${result.successCount} task(s) updated`, duration: 2000 });
    } else {
      toast({ 
        title: "Some tasks failed to update", 
        description: `${result.successCount} succeeded, ${result.failedCount} failed`,
        variant: "destructive" 
      });
    }
    setSelectedTaskIds([]);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const handleBulkPriorityChange = async (priority: string) => {
    const result = await setPriorityBulk(selectedTaskIds, priority as 'Low' | 'Medium' | 'High');
    if (result.success) {
      toast({ title: `${result.successCount} task(s) priority updated`, duration: 2000 });
    } else {
      toast({ 
        title: "Some tasks failed to update", 
        description: `${result.successCount} succeeded, ${result.failedCount} failed`,
        variant: "destructive" 
      });
    }
    setSelectedTaskIds([]);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const handleBulkDelete = async () => {
    const result = await deleteTasksBulk(selectedTaskIds);
    if (result.success) {
      toast({ title: `${result.successCount} task(s) deleted`, duration: 2000 });
    } else {
      toast({ 
        title: "Some tasks failed to delete", 
        description: `${result.successCount} succeeded, ${result.failedCount} failed`,
        variant: "destructive" 
      });
    }
    setSelectedTaskIds([]);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };
  const handleBulkExport = () => { const selectedTasks = finalFilteredTasks.filter(t => selectedTaskIds.includes(t.id)); exportTasksToCSV(selectedTasks); };

  return (
    <div className="min-h-screen bg-background relative">
      <TaskBulkActionsBar
        selectedCount={selectedTaskIds.length}
        onClearSelection={() => setSelectedTaskIds([])}
        onComplete={handleBulkComplete}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
        onPriorityChange={handleBulkPriorityChange}
        onExport={handleBulkExport}
      />
      
      <PageContainer size="wide">
        <PageHeader
          icon={ListTodo}
          title="Tasks"
          description="Manage and track your team's tasks"
          actions={
            <Button onClick={() => setDialogOpen(true)} className="rounded-full px-6 h-10 gap-2 shadow-sm text-[14px] font-medium">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          }
        />

        {/* Toolbar - Unified filter bar */}
        <FilterBar search={{ value: searchQuery, onChange: setSearchQuery, placeholder: "Search tasks..." }}>
          {/* My Tasks Quick Filter */}
          <Button
            variant={showMyTasks ? "default" : "outline"}
            onClick={() => setShowMyTasks(!showMyTasks)}
            className="gap-2"
          >
            <User className="h-4 w-4" />
            My Tasks
            {myTasksCount > 0 && (
              <Badge variant={showMyTasks ? "secondary" : "default"} className="ml-1 h-5 px-1.5 text-metadata">
                {myTasksCount}
              </Badge>
            )}
          </Button>

          <StatusMultiSelect value={statusFilters} onChange={setStatusFilters} />
          
          <Select value={selectedTags.length > 0 ? "selected" : "all"} onValueChange={(value) => { if (value === "all") setSelectedTags([]); }}>
            <SelectTrigger className="w-[110px]">
              <SelectValue>{selectedTags.length > 0 ? `${selectedTags.length} tags` : "Tags"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {TASK_TAGS.map((tag) => (
                <div key={tag.value} onClick={(e) => { e.preventDefault(); setSelectedTags(prev => prev.includes(tag.value) ? prev.filter(t => t !== tag.value) : [...prev, tag.value]); }} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted rounded-lg text-body-sm">
                  <input type="checkbox" checked={selectedTags.includes(tag.value)} onChange={() => {}} className="cursor-pointer rounded" />
                  <span>{tag.label}</span>
                </div>
              ))}
            </SelectContent>
          </Select>

          <AssigneeFilterBar selectedAssignees={selectedAssignees} onAssigneesChange={setSelectedAssignees} />
          <TaskDateFilterBar value={dateFilter ? { from: dateFilter.startDate, to: dateFilter.endDate } : null} onFilterChange={setDateFilter} onStatusChange={() => {}} selectedStatus="all" />

          <Button 
            variant={!hideRecurring ? "default" : "outline"} 
            onClick={() => setHideRecurring(!hideRecurring)} 
            title={hideRecurring ? "Show recurring tasks" : "Hide recurring tasks"}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {hideRecurring ? "Show Recurring" : "Hide Recurring"}
          </Button>

          {/* Table Grouping - only show in table view */}
          {viewMode === 'table' && (
            <Select value={tableGroupBy} onValueChange={(v: any) => setTableGroupBy(v)}>
              <SelectTrigger className="w-[130px]">
                <Layers className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="assignee">Assignee</SelectItem>
                <SelectItem value="tags">Tags</SelectItem>
              </SelectContent>
            </Select>
          )}

          <div className="ml-auto flex gap-1 flex-shrink-0 bg-card p-1 rounded-lg border border-border">
            {[
              { mode: 'table' as const, icon: List, title: 'Table' },
              { mode: 'kanban-status' as const, icon: Columns3, title: 'Kanban Status' },
              { mode: 'kanban-date' as const, icon: Clock, title: 'Kanban Date' },
              { mode: 'kanban-tags' as const, icon: Tag, title: 'Kanban Tags' },
            ].map(({ mode, icon: Icon, title }) => (
              <Button 
                key={mode} 
                variant={viewMode === mode ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => { 
                  setViewMode(mode); 
                  if (mode === 'kanban-status') setBoardGroupBy('status'); 
                  if (mode === 'kanban-date') setBoardGroupBy('date'); 
                  if (mode === 'kanban-tags') setBoardGroupBy('tags');
                }} 
                title={title}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </FilterBar>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
            <span className="text-body-sm text-muted-foreground">Showing {finalFilteredTasks.length} of {data?.length || 0} tasks</span>
          </div>
        )}

        {/* Task Views */}
        {finalFilteredTasks.length === 0 ? (
          <DataCard>
            <EmptyState
              icon={CheckCircle2}
              title="All Clear!"
              description={tasks.length === 0 ? "You don't have any tasks yet. Create your first task to get started." : "No tasks found matching your filters. Try adjusting your search."}
              action={tasks.length === 0 ? { label: "Create Your First Task", onClick: () => setDialogOpen(true) } : undefined}
            />
          </DataCard>
        ) : (
          <>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, finalFilteredTasks.length)}-{Math.min(currentPage * itemsPerPage, finalFilteredTasks.length)} of {finalFilteredTasks.length} tasks
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-muted-foreground">Items per page:</span>
                <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[80px] h-10 rounded-lg bg-card border-border text-[14px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-popover border-border shadow-lg">
                    {[10, 20, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DataCard noPadding>
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
                        <TasksTable tasks={paginatedTasks} onTaskUpdate={refetch} selectedIds={selectedTaskIds} onSelectionChange={setSelectedTaskIds} groupBy={tableGroupBy} />
                      )
                    )}
                    {/* Grid view removed */}
                    {(viewMode === 'kanban-status' || viewMode === 'kanban-date' || viewMode === 'kanban-tags') && <div className="p-4"><TaskBoardView tasks={finalFilteredTasks} onTaskClick={handleTaskClick} groupBy={boardGroupBy} /></div>}

                    {totalPages > 1 && (
                      <div className="border-t border-border p-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={cn(currentPage === 1 && "pointer-events-none opacity-50")} />
                            </PaginationItem>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) pageNum = i + 1;
                              else if (currentPage <= 3) pageNum = i + 1;
                              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                              else pageNum = currentPage - 2 + i;
                              return (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink onClick={() => setCurrentPage(pageNum)} isActive={currentPage === pageNum}>{pageNum}</PaginationLink>
                                </PaginationItem>
                              );
                            })}
                            <PaginationItem>
                              <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={cn(currentPage === totalPages && "pointer-events-none opacity-50")} />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                );
              })()}
            </DataCard>
          </>
        )}

        <UnifiedTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} mode="create" />
        {selectedTaskId && <UnifiedTaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} mode="view" taskId={selectedTaskId} />}
        <FilteredTasksDialog
          open={filteredDialogOpen}
          onOpenChange={setFilteredDialogOpen}
          filterType={filteredDialogType}
          tasks={(() => {
            if (filteredDialogType === 'overdue') return tasks.filter((t: any) => t.due_at && new Date(t.due_at) < new Date() && t.status !== 'Completed');
            else if (filteredDialogType === 'ongoing') return tasks.filter((t: any) => t.status === 'Ongoing');
            else if (filteredDialogType === 'completed') return tasks.filter((t: any) => t.status === 'Completed');
            return tasks;
          })()}
          onRefresh={refetch}
        />
      </PageContainer>
    </div>
  );
}
