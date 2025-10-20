import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, ListTodo, AlertCircle, Clock, Shield, TrendingUp, List, LayoutGrid, Columns3, Filter, Users, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { TasksTable } from "@/components/TasksTable";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { TaskTemplateDialog } from "@/components/TaskTemplateDialog";
import { AssigneeFilterBar } from "@/components/AssigneeFilterBar";
import { TaskDateFilterBar } from "@/components/TaskDateFilterBar";
import { TaskStatsCards } from "@/components/tasks/TaskStatsCards";
import { TaskGridView } from "@/components/tasks/TaskGridView";
import { TaskBoardView } from "@/components/tasks/TaskBoardView";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { TaskDialog } from "@/components/TaskDialog";

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
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const fetchTasks = async () => {
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

    return (data || []).map((task: any) => {
      return {
        ...task,
        assignees: task.task_assignees?.map((ta: any) => ta.profiles).filter(Boolean) || [],
        comments_count: task.task_comment_counts?.[0]?.comment_count || 0
      };
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
    
    const searchMatch = debouncedSearch === "" || 
      task.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
    
    return assigneeMatch && teamMatch && dateMatch && statusMatch && searchMatch;
  });

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage and track your team's tasks</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTemplateDialogOpen(true)} variant="outline">
            <ListTodo className="mr-2 h-4 w-4" />
            Use Template
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>
      
      {/* Statistics Dashboard */}
      <TaskStatsCards
        totalTasks={totalTasks}
        overdueCount={overdueCount}
        ongoingCount={ongoingCount}
        completedCount={completedCount}
      />
      
      {/* Progress Indicator */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-bold">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {completedCount} of {totalTasks} tasks completed
        </p>
      </Card>

      {/* Search and View Switcher */}
      <div className="flex gap-2 items-center justify-between">
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'board' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('board')}
          >
            <Columns3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters with Accordion */}
      <Card className="p-4">
        <Accordion type="multiple" defaultValue={["quick", "assignee", "date"]}>
          <AccordionItem value="quick" className="border-0">
            <AccordionTrigger className="font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Quick Filters
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex gap-2 flex-wrap pt-2">
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
          
          <AccordionItem value="assignee" className="border-0">
            <AccordionTrigger className="font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assignees & Teams
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2">
                <AssigneeFilterBar
                  selectedAssignees={selectedAssignees}
                  onAssigneesChange={setSelectedAssignees}
                  selectedTeams={selectedTeams}
                  onTeamsChange={setSelectedTeams}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="date" className="border-0">
            <AccordionTrigger className="font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Date & Status
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2">
                <TaskDateFilterBar
                  onFilterChange={setDateFilter}
                  onStatusChange={setStatusFilter}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Task Views */}
      {filteredTasks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-primary/10 p-6 rounded-full mb-4">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">All Clear! 🎉</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
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
        </Card>
      ) : (
        <>
          {viewMode === 'table' && <TasksTable tasks={filteredTasks} onTaskUpdate={refetch} />}
          {viewMode === 'grid' && <TaskGridView tasks={filteredTasks} onTaskClick={handleTaskClick} />}
          {viewMode === 'board' && <TaskBoardView tasks={filteredTasks} onTaskClick={handleTaskClick} />}
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
    </div>
  );
}
