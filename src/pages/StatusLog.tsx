import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Search, Filter, ListTodo } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { UnifiedTaskDialog } from "@/components/UnifiedTaskDialog";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUSES } from "@/lib/constants";

const StatusLog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set(["UAE", "KWT", "BHR", "EGY", "JOR", "Unassigned"]));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const { data: tasks = [], isLoading } = useTasks();

  // Group tasks by entity
  const tasksByEntity = useMemo(() => {
    const grouped: Record<string, typeof tasks> = {};
    
    // Filter tasks first
    const filteredTasks = tasks.filter((task) => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    filteredTasks.forEach((task) => {
      const entities = task.entity && task.entity.length > 0 ? task.entity : ["Unassigned"];
      entities.forEach((entity: string) => {
        if (!grouped[entity]) {
          grouped[entity] = [];
        }
        grouped[entity].push(task);
      });
    });

    // Sort entities alphabetically, but put "Unassigned" at the end
    const sortedEntries = Object.entries(grouped).sort(([a], [b]) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      return a.localeCompare(b);
    });

    return sortedEntries;
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const toggleEntity = (entity: string) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(entity)) {
        next.delete(entity);
      } else {
        next.add(entity);
      }
      return next;
    });
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-destructive";
      case "Medium": return "bg-warning";
      case "Low": return "bg-success";
      default: return "bg-muted";
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Pending: "bg-muted text-muted-foreground",
      Backlog: "bg-muted text-muted-foreground",
      Ongoing: "bg-primary/15 text-primary",
      Blocked: "bg-destructive/15 text-destructive",
      Completed: "bg-success/15 text-success",
      Failed: "bg-destructive/15 text-destructive",
    };
    return <Badge className={colors[status] || "bg-muted text-muted-foreground"}>{status}</Badge>;
  };

  const getDueDateDisplay = (dueAt: string | null) => {
    if (!dueAt) return <span className="text-muted-foreground">No date</span>;
    const date = new Date(dueAt);
    const isOverdue = isPast(date) && !isToday(date);
    
    let label = format(date, "MMM d");
    if (isToday(date)) label = "Today";
    else if (isTomorrow(date)) label = "Tomorrow";
    
    return (
      <span className={isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>
        {label}
      </span>
    );
  };

  const totalTasks = tasksByEntity.reduce((acc, [, entityTasks]) => acc + entityTasks.length, 0);

  return (
    <div className="px-md sm:px-lg lg:px-12 py-lg lg:py-8 space-y-lg lg:space-y-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <ListTodo className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-page-title">Entity Task Tracker</h1>
            <p className="text-muted-foreground mt-1">
              {totalTasks} tasks across {tasksByEntity.length} entities
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-sm">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {TASK_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entity Groups */}
      {isLoading ? (
        <TableSkeleton columns={5} rows={8} />
      ) : tasksByEntity.length === 0 ? (
        <Card className="p-lg text-center">
          <p className="text-muted-foreground">No tasks found matching your filters.</p>
        </Card>
      ) : (
        <div className="space-y-md">
          {tasksByEntity.map(([entity, entityTasks]) => (
            <Collapsible
              key={entity}
              open={expandedEntities.has(entity)}
              onOpenChange={() => toggleEntity(entity)}
            >
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-md hover:bg-muted/50 transition-smooth">
                    <div className="flex items-center gap-sm">
                      {expandedEntities.has(entity) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="font-semibold text-heading-sm">{entity}</span>
                      <Badge variant="secondary" className="ml-sm">
                        {entityTasks.length} {entityTasks.length === 1 ? "task" : "tasks"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-xs">
                      {entityTasks.filter(t => t.priority === "High").length > 0 && (
                        <Badge className="bg-destructive/15 text-destructive">
                          {entityTasks.filter(t => t.priority === "High").length} High
                        </Badge>
                      )}
                      {entityTasks.filter(t => t.status === "Blocked").length > 0 && (
                        <Badge className="bg-warning/15 text-warning">
                          {entityTasks.filter(t => t.status === "Blocked").length} Blocked
                        </Badge>
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t border-border">
                    {entityTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task.id)}
                        className="flex items-center gap-md p-md border-b border-border/50 last:border-b-0 hover:bg-muted/30 cursor-pointer transition-smooth"
                      >
                        {/* Priority indicator */}
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                        
                        {/* Task info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.title}</p>
                          {task.assignees && task.assignees.length > 0 && (
                            <p className="text-metadata text-muted-foreground truncate">
                              {task.assignees.map((a: any) => a.name).join(", ")}
                            </p>
                          )}
                        </div>
                        
                        {/* Status */}
                        <div className="hidden sm:block">
                          {getStatusBadge(task.status)}
                        </div>
                        
                        {/* Due date */}
                        <div className="text-metadata w-20 text-right">
                          {getDueDateDisplay(task.due_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Task Dialog */}
      <UnifiedTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        taskId={selectedTaskId}
        mode="view"
      />
    </div>
  );
};

export default StatusLog;
