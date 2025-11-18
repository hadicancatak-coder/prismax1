import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Plus, ListTodo, AlertCircle, Clock, Shield, TrendingUp, List, LayoutGrid, Columns3, X, CheckCircle2, ChevronUp, ChevronDown } from "lucide-react";
import { TasksTable } from "@/components/TasksTable";
import { TasksTableVirtualized } from "@/components/TasksTableVirtualized";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TaskTemplateDialog } from "@/components/TaskTemplateDialog";
import { AssigneeFilterBar } from "@/components/AssigneeFilterBar";
import { TaskDateFilterBar } from "@/components/TaskDateFilterBar";

import { TaskGridView } from "@/components/tasks/TaskGridView";
import { TaskBoardView } from "@/components/tasks/TaskBoardView";
import { FilteredTasksDialog } from "@/components/tasks/FilteredTasksDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { TaskDialog } from "@/components/TaskDialog";
import { useTasks } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { CardSkeleton } from "@/components/skeletons/CardSkeleton";
import { TaskBulkActionsBar } from "@/components/tasks/TaskBulkActionsBar";
import { exportTasksToCSV } from "@/lib/taskExport";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState<'all' | 'generic' | 'campaign' | 'recurring'>('all');
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
      filter: (task: any) => task.due_at && new Date(task.due_at) < new Date() && task.status !== 'Completed'
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

  let filteredTasks = (data || []).filter((task: any) => {
    const assigneeMatch = selectedAssignees.length === 0 || 
      task.assignees?.some((assignee: any) => selectedAssignees.includes(assignee.user_id));
    
    // Fix team filtering - check task.teams directly AND assignee teams
    const teamMatch = selectedTeams.length === 0 || 
      task.assignees?.some((assignee: any) => 
        assignee.teams?.some((team: string) => selectedTeams.includes(team))
      );
    
    let dateMatch = true;
    if (dateFilter) {
      if (!task.due_at) {
        dateMatch = dateFilter.label === "Backlog";
      } else {
        const dueDate = new Date(task.due_at);
        dateMatch = dueDate >= dateFilter.startDate && dueDate <= dateFilter.endDate;
      }
    }
    
    const statusMatch = statusFilter === "all" || task.status === statusFilter;
    
    const taskTypeMatch = taskTypeFilter === "all" || task.task_type === taskTypeFilter;
    
    const searchMatch = debouncedSearch === "" || 
      task.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
    
    return assigneeMatch && teamMatch && dateMatch && statusMatch && taskTypeMatch && searchMatch;
  });

  // Apply filter recalculation when dependencies change
  useEffect(() => {
    // Force re-render when filters change
    setCurrentPage(1);
  }, [selectedAssignees, selectedTeams, dateFilter, statusFilter, debouncedSearch]);

  if (activeQuickFilter) {
    const quickFilterDef = quickFilters.find(f => f.label === activeQuickFilter);
    if (quickFilterDef) {
      filteredTasks = filteredTasks.filter(quickFilterDef.filter);
    }
  }

  const tasks = data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasActiveFilters = selectedAssignees.length > 0 || selectedTeams.length > 0 || dateFilter || statusFilter !== "all" || taskTypeFilter !== "all" || activeQuickFilter || searchQuery;

  const clearAllFilters = () => {
    setSelectedAssignees([]);
    setSelectedTeams([]);
    setDateFilter(null);
    setStatusFilter("all");
    setTaskTypeFilter("all");
    setActiveQuickFilter(null);
    setSearchQuery("");
    setSelectedTaskIds([]);
  };

  const handleBulkComplete = async () => {
    await Promise.all(selectedTaskIds.map(id => supabase.from('tasks').update({ status: 'Completed' }).eq('id', id)));
    setSelectedTaskIds([]);
  };

  const handleBulkStatusChange = async (status: string) => {
    await Promise.all(selectedTaskIds.map(id => 
      supabase.from('tasks').update({ status: status as any }).eq('id', id)
    ));
    setSelectedTaskIds([]);
  };

  const handleBulkPriorityChange = async (priority: string) => {
    await Promise.all(selectedTaskIds.map(id => 
      supabase.from('tasks').update({ priority: priority as any }).eq('id', id)
    ));
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = async () => {
    await Promise.all(selectedTaskIds.map(id => supabase.from('tasks').delete().eq('id', id)));
    setSelectedTaskIds([]);
  };

  const handleBulkExport = () => {
    const selectedTasks = filteredTasks.filter(t => selectedTaskIds.includes(t.id));
    exportTasksToCSV(selectedTasks);
  };

  return (
    <div className="px-6 md:px-12 py-8 space-y-6 relative">
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title text-foreground">Tasks</h1>
            <p className="text-body text-muted-foreground">Manage and track your team's tasks</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setTemplateDialogOpen(true)} variant="outline" className="min-h-[44px]">
              <ListTodo className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Template</span>
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="min-h-[44px]">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Task</span>
            </Button>
          </div>
        </div>

        {/* Consolidated Filters - Collapsible */}
        <Card className="p-2">
        <div className="space-y-2">
          {/* Always Visible - Single Compact Row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 h-8 text-sm"
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={taskTypeFilter} onValueChange={(value: any) => setTaskTypeFilter(value)}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue placeholder="Task Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="generic">Generic</SelectItem>
                <SelectItem value="campaign">Campaigns</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="h-8 gap-1.5 text-sm"
            >
              {filtersExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              More Filters
              {(selectedAssignees.length > 0 || selectedTeams.length > 0 || dateFilter) && (
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-xs">
                  {[selectedAssignees.length > 0, selectedTeams.length > 0, dateFilter].filter(Boolean).length}
                </Badge>
              )}
            </Button>

            <div className="ml-auto flex gap-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 w-8 p-0"
                title="Table View"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban-status' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('kanban-status');
                  setBoardGroupBy('status');
                }}
                className="h-8 w-8 p-0"
                title="Kanban by Status"
              >
                <Columns3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Expandable Filters Section */}
          {filtersExpanded && (
            <div className="border-t pt-2 space-y-2">
              <AssigneeFilterBar
                selectedAssignees={selectedAssignees}
                onAssigneesChange={setSelectedAssignees}
                selectedTeams={selectedTeams}
                onTeamsChange={setSelectedTeams}
              />
              
              <TaskDateFilterBar
                value={dateFilter ? { from: dateFilter.startDate, to: dateFilter.endDate } : null}
                onFilterChange={setDateFilter}
                onStatusChange={() => {}}
                selectedStatus="all"
              />
            </div>
          )}

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-1 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All Filters
              </Button>
              <span className="text-xs text-muted-foreground">
                Showing {filteredTasks.length} of {data?.length || 0} tasks
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Task Views */}
      {filteredTasks.length === 0 ? (
        <div className="py-12 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-muted p-6 rounded-full mb-4">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-section-title mb-2">All Clear! 🎉</h2>
            <p className="text-body text-muted-foreground mb-6 max-w-md">
              {tasks.length === 0 
                ? "You don't have any tasks yet. Create your first task to get started on achieving your goals."
                : "No tasks found matching your filters. Try adjusting your search criteria."}
            </p>
            {tasks.length === 0 && (
              <Button size="lg" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Task
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Pagination Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTasks.length)}-{Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            const paginatedTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage);
            const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

            return (
              <>
                {viewMode === 'table' && (
                  filteredTasks.length > 100 ? (
                    <TasksTableVirtualized tasks={filteredTasks} onTaskUpdate={refetch} />
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
                    tasks={filteredTasks} 
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

      <CreateTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <TaskTemplateDialog 
        open={templateDialogOpen} 
        onOpenChange={setTemplateDialogOpen}
        onCreateFromTemplate={() => {}}
      />
      {selectedTaskId && (
        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
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
