import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Plus, ListTodo, AlertCircle, Clock, Shield, TrendingUp, List, LayoutGrid, Columns3, Filter, Users, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { TasksTable } from "@/components/TasksTable";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TaskTemplateDialog } from "@/components/TaskTemplateDialog";
import { AssigneeFilterBar } from "@/components/AssigneeFilterBar";
import { TaskDateFilterBar } from "@/components/TaskDateFilterBar";
import { TaskStatsCards } from "@/components/tasks/TaskStatsCards";
import { TaskGridView } from "@/components/tasks/TaskGridView";
import { TaskBoardView } from "@/components/tasks/TaskBoardView";
import { FilteredTasksDialog } from "@/components/tasks/FilteredTasksDialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { TaskDialog } from "@/components/TaskDialog";
import { useAuth } from "@/hooks/useAuth";

export default function Tasks() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'board'>('table');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [filteredDialogOpen, setFilteredDialogOpen] = useState(false);
  const [filteredDialogType, setFilteredDialogType] = useState<'all' | 'overdue' | 'ongoing' | 'completed'>('all');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  useEffect(() => {
    const saved = localStorage.getItem('tasksItemsPerPage');
    if (saved) setItemsPerPage(Number(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasksItemsPerPage', String(itemsPerPage));
  }, [itemsPerPage]);

  const { user, userRole } = useAuth();

  const fetchTasks = async () => {
    if (!user) return [];

    // Get current user's profile with teams
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, user_id, teams')
      .eq('user_id', user.id)
      .single();

    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        task_assignees(
          profiles:user_id(id, user_id, name, avatar_url, teams)
        ),
        task_comment_counts(comment_count)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map tasks and filter by team membership
    const allTasks = (data || []).map((task: any) => {
      return {
        ...task,
        assignees: task.task_assignees?.map((ta: any) => ta.profiles).filter(Boolean) || [],
        comments_count: task.task_comment_counts?.[0]?.comment_count || 0
      };
    });

    // Filter tasks where user is either:
    // 1. Direct assignee OR
    // 2. Member of an assigned team
    return allTasks.filter((task: any) => {
      // Check direct assignment
      const isDirectAssignee = task.assignees?.some((a: any) => a.user_id === user.id);
      
      // Check team membership
      const userTeams = currentProfile?.teams || [];
      const taskTeams = Array.isArray(task.teams) 
        ? task.teams 
        : (typeof task.teams === 'string' ? JSON.parse(task.teams) : []);
      
      const isTeamMember = userTeams.some((team: string) => taskTeams.includes(team));
      
      // Show if user is admin, direct assignee, or team member
      return userRole === 'admin' || isDirectAssignee || isTeamMember;
    });
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskDialogOpen(true);
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

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
    const taskTeams = Array.isArray(task.teams) && task.teams.length > 0
      ? task.teams 
      : (typeof task.teams === 'string' ? JSON.parse(task.teams) : []);
    
    const teamMatch = selectedTeams.length === 0 || 
      (taskTeams.length === 0) || // Show legacy tasks with no teams
      taskTeams.some((team: string) => selectedTeams.includes(team)) ||
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
    
    const searchMatch = debouncedSearch === "" || 
      task.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
    
    return assigneeMatch && teamMatch && dateMatch && statusMatch && searchMatch;
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
  
  // Calculate statistics
  const totalTasks = tasks.length;
  const overdueCount = tasks.filter((task: any) => {
    if (!task.due_at || task.status === 'Completed') return false;
    return new Date(task.due_at) < new Date();
  }).length;
  const ongoingCount = tasks.filter((task: any) => task.status === 'Ongoing').length;
  const completedCount = tasks.filter((task: any) => task.status === 'Completed').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-48 py-8 space-y-8">
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
      
      {/* Statistics Dashboard */}
      <TaskStatsCards
        totalTasks={totalTasks}
        overdueCount={overdueCount}
        ongoingCount={ongoingCount}
        completedCount={completedCount}
        onCardClick={(type) => {
          setFilteredDialogType(type);
          setFilteredDialogOpen(true);
        }}
      />
      

      {/* Search and View Switcher - Responsive */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center sm:justify-between">
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-sm min-h-[44px]"
        />
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('table')}
            className="min-h-[44px] min-w-[44px]"
            title="Table View"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="min-h-[44px] min-w-[44px]"
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'board' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('board')}
            className="min-h-[44px] min-w-[44px]"
            title="Board View"
          >
            <Columns3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters with Accordion */}
      <div className="border border-border rounded">
        <Accordion type="multiple" defaultValue={[]}>
          <AccordionItem value="quick" className="border-0 px-4">
            <AccordionTrigger className="font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Quick Filters
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex gap-2 flex-wrap pt-2 pb-4">
                {quickFilters.map(({ label, Icon }) => {
                  const count = filteredTasks.filter(quickFilters.find(f => f.label === label)!.filter).length;
                  return (
                    <Button
                      key={label}
                      variant={activeQuickFilter === label ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveQuickFilter(activeQuickFilter === label ? null : label)}
                      className={cn(
                        "gap-2",
                        activeQuickFilter === label && "ring-2 ring-offset-2 ring-primary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                      <span className="ml-1 text-xs font-bold">({count})</span>
                    </Button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="assignee" className="border-0 px-4">
            <AccordionTrigger className="font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assignees & Teams
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 pb-4">
                <AssigneeFilterBar
                  selectedAssignees={selectedAssignees}
                  onAssigneesChange={setSelectedAssignees}
                  selectedTeams={selectedTeams}
                  onTeamsChange={setSelectedTeams}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="date" className="border-0 px-4">
            <AccordionTrigger className="font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Date & Status
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 pb-4">
                <TaskDateFilterBar
                  onFilterChange={setDateFilter}
                  onStatusChange={setStatusFilter}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

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
                {viewMode === 'table' && <TasksTable tasks={paginatedTasks} onTaskUpdate={refetch} />}
                {viewMode === 'grid' && <TaskGridView tasks={paginatedTasks} onTaskClick={handleTaskClick} />}
                {viewMode === 'board' && <TaskBoardView tasks={filteredTasks} onTaskClick={handleTaskClick} />}

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
  );
}
