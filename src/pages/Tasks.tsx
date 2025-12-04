import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Plus, ListTodo, AlertCircle, Clock, Shield, TrendingUp, List, LayoutGrid, Columns3, X, CheckCircle2, RefreshCw } from "lucide-react";
import { TasksTable } from "@/components/TasksTable";
import { TasksTableVirtualized } from "@/components/TasksTableVirtualized";
import { UnifiedTaskDialog } from "@/components/UnifiedTaskDialog";
import { AssigneeFilterBar } from "@/components/AssigneeFilterBar";
import { TaskDateFilterBar } from "@/components/TaskDateFilterBar";
import { StatusMultiSelect } from "@/components/tasks/StatusMultiSelect";
import { TaskGridView } from "@/components/tasks/TaskGridView";
import { TaskBoardView } from "@/components/tasks/TaskBoardView";
import { FilteredTasksDialog } from "@/components/tasks/FilteredTasksDialog";
import { PageContainer, PageHeader, AlertBanner, DataCard, EmptyState } from "@/components/layout";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { TaskBulkActionsBar } from "@/components/tasks/TaskBulkActionsBar";
import { exportTasksToCSV } from "@/lib/taskExport";
import { supabase } from "@/integrations/supabase/client";
import { isTaskOverdue } from "@/lib/overdueHelpers";

export default function Tasks() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<any>(null);
  const [statusFilters, setStatusFilters] = useState<string[]>(['Pending', 'Ongoing', 'Blocked', 'Failed']);
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
    { label: "Overdue", Icon: AlertCircle, filter: (task: any) => isTaskOverdue(task), clearOtherFilters: true },
    { label: "Due Soon", Icon: Clock, filter: (task: any) => { if (!task.due_at) return false; const dueDate = new Date(task.due_at); const threeDaysFromNow = addDays(new Date(), 3); return dueDate <= threeDaysFromNow && dueDate >= new Date() && task.status !== 'Completed'; }},
    { label: "Blocked", Icon: Shield, filter: (task: any) => task.status === 'Blocked' },
    { label: "High Priority", Icon: TrendingUp, filter: (task: any) => task.priority === 'High' && task.status !== 'Completed' }
  ];

  const filteredTasks = useMemo(() => {
    return (data || []).filter((task: any) => {
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
  }, [data, selectedAssignees, dateFilter, statusFilters, selectedTags, debouncedSearch, hideRecurring]);

  const finalFilteredTasks = useMemo(() => {
    if (activeQuickFilter) {
      const quickFilterDef = quickFilters.find(f => f.label === activeQuickFilter);
      if (quickFilterDef) return filteredTasks.filter(quickFilterDef.filter);
    }
    return filteredTasks;
  }, [filteredTasks, activeQuickFilter]);

  useEffect(() => { setCurrentPage(1); }, [selectedAssignees, dateFilter, statusFilters, selectedTags, debouncedSearch, activeQuickFilter]);

  const tasks = data || [];
  const hasActiveFilters = selectedAssignees.length > 0 || selectedTags.length > 0 || dateFilter || statusFilters.length !== 4 || activeQuickFilter || searchQuery;
  const overdueCount = finalFilteredTasks.filter(task => isTaskOverdue(task)).length;

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
  };

  const handleQuickFilter = (filterLabel: string) => {
    const filter = quickFilters.find(f => f.label === filterLabel);
    if (activeQuickFilter === filterLabel) { setActiveQuickFilter(null); } 
    else { if (filter?.clearOtherFilters) clearAllFilters(); setActiveQuickFilter(filterLabel); }
  };

  const handleBulkComplete = async () => { await Promise.all(selectedTaskIds.map(id => supabase.from('tasks').update({ status: 'Completed' }).eq('id', id))); setSelectedTaskIds([]); refetch(); };
  const handleBulkStatusChange = async (status: string) => { await Promise.all(selectedTaskIds.map(id => supabase.from('tasks').update({ status: status as any }).eq('id', id))); setSelectedTaskIds([]); refetch(); };
  const handleBulkPriorityChange = async (priority: string) => { await Promise.all(selectedTaskIds.map(id => supabase.from('tasks').update({ priority: priority as any }).eq('id', id))); setSelectedTaskIds([]); refetch(); };
  const handleBulkDelete = async () => { await Promise.all(selectedTaskIds.map(id => supabase.from('tasks').delete().eq('id', id))); setSelectedTaskIds([]); refetch(); };
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
        <div className="flex flex-wrap items-center gap-3 bg-muted/40 rounded-xl px-4 py-3 border border-border">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 md:w-64 h-10 rounded-lg bg-card border-border text-[14px]"
          />
          
          <StatusMultiSelect value={statusFilters} onChange={setStatusFilters} />
          
          <Select value={selectedTags.length > 0 ? "selected" : "all"} onValueChange={(value) => { if (value === "all") setSelectedTags([]); }}>
            <SelectTrigger className="w-[110px] h-10 rounded-lg bg-card border-border text-[14px]">
              <SelectValue>{selectedTags.length > 0 ? `${selectedTags.length} tags` : "Tags"}</SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-popover border-border shadow-lg">
              <SelectItem value="all">All Tags</SelectItem>
              {['urgent', 'review', 'bug', 'feature', 'docs'].map((tag) => (
                <div key={tag} onClick={(e) => { e.preventDefault(); setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]); }} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted rounded-lg text-[14px]">
                  <input type="checkbox" checked={selectedTags.includes(tag)} onChange={() => {}} className="cursor-pointer rounded" />
                  <span className="capitalize">{tag}</span>
                </div>
              ))}
            </SelectContent>
          </Select>

          <AssigneeFilterBar selectedAssignees={selectedAssignees} onAssigneesChange={setSelectedAssignees} />
          <TaskDateFilterBar value={dateFilter ? { from: dateFilter.startDate, to: dateFilter.endDate } : null} onFilterChange={setDateFilter} onStatusChange={() => {}} selectedStatus="all" />

          <button onClick={() => setHideRecurring(!hideRecurring)} className={cn("h-10 text-[13px] rounded-lg px-4 border border-border bg-card transition-all flex items-center gap-2", !hideRecurring && "bg-primary text-primary-foreground border-primary")} title={hideRecurring ? "Show recurring tasks" : "Hide recurring tasks"}>
            <RefreshCw className="h-3.5 w-3.5" />
            {hideRecurring ? "Show Recurring" : "Hide Recurring"}
          </button>

          <div className="ml-auto flex gap-1 flex-shrink-0 bg-card p-1 rounded-lg border border-border">
            {[
              { mode: 'table' as const, icon: List, title: 'Table' },
              { mode: 'grid' as const, icon: LayoutGrid, title: 'Grid' },
              { mode: 'kanban-status' as const, icon: Columns3, title: 'Kanban Status' },
              { mode: 'kanban-date' as const, icon: Clock, title: 'Kanban Date' },
            ].map(({ mode, icon: Icon, title }) => (
              <button key={mode} onClick={() => { setViewMode(mode); if (mode === 'kanban-status') setBoardGroupBy('status'); if (mode === 'kanban-date') setBoardGroupBy('date'); }} className={cn("h-9 w-9 rounded-md flex items-center justify-center transition-all", viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")} title={title}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-3">
            <button onClick={clearAllFilters} className="h-9 text-[13px] text-muted-foreground hover:text-foreground rounded-lg px-4 transition-colors flex items-center gap-2">
              <X className="h-3.5 w-3.5" />
              Clear All Filters
            </button>
            <span className="text-[13px] text-muted-foreground">Showing {finalFilteredTasks.length} of {data?.length || 0} tasks</span>
          </div>
        )}

        {/* Overdue Alert */}
        {overdueCount > 0 && (
          <AlertBanner variant="error" title="Overdue Tasks">
            You have {overdueCount} overdue task{overdueCount !== 1 ? 's' : ''} that need attention
          </AlertBanner>
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
                        <TasksTable tasks={paginatedTasks} onTaskUpdate={refetch} selectedIds={selectedTaskIds} onSelectionChange={setSelectedTaskIds} />
                      )
                    )}
                    {viewMode === 'grid' && <div className="p-4"><TaskGridView tasks={paginatedTasks} onTaskClick={handleTaskClick} /></div>}
                    {(viewMode === 'kanban-status' || viewMode === 'kanban-date') && <div className="p-4"><TaskBoardView tasks={finalFilteredTasks} onTaskClick={handleTaskClick} groupBy={boardGroupBy} /></div>}

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
