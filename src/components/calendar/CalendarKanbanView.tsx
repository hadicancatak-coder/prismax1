import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarKanbanViewProps {
  tasks: any[];
  view: 'today' | 'day' | 'week' | 'month';
  dateView: string;
  workingDays?: string[];
  selectedDate?: Date;
  onTaskClick: (taskId: string) => void;
}

export const CalendarKanbanView = ({ 
  tasks, 
  view, 
  dateView,
  workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  selectedDate = new Date(),
  onTaskClick 
}: CalendarKanbanViewProps) => {
  
  const priorityColors = {
    High: "bg-red-500/10 text-red-600 border-red-500/20",
    Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    Low: "bg-green-500/10 text-green-600 border-green-500/20",
  };

  const statusColors: Record<string, string> = {
    Pending: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Ongoing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Blocked: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Completed: "bg-green-500/20 text-green-400 border-green-500/30",
    Failed: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  // Determine columns based on view type
  const columns = useMemo(() => {
    // For today/day views - group by status
    if (view === 'today' || view === 'day') {
      const statusColumns = ['Pending', 'Ongoing', 'Blocked', 'Completed', 'Failed'];
      return statusColumns.map(status => ({
        id: status,
        label: status,
        tasks: tasks.filter(t => t.status === status),
        dateRange: undefined
      }));
    }
    
    // For week view - group by working days
    if (view === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      
      return dayNames.map((dayName, index) => {
        const dayDate = addDays(weekStart, index);
        return {
          id: dayName,
          label: dayName,
          date: dayDate,
          dateRange: undefined,
          tasks: tasks.filter(t => {
            if (!t.due_at) return false;
            return isSameDay(new Date(t.due_at), dayDate);
          })
        };
      });
    }
    
    // For month view - group by weeks (working days only)
    if (view === 'month') {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
      
      return weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        return {
          id: `week-${index}`,
          label: `Week ${index + 1}`,
          dateRange: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
          tasks: tasks.filter(t => {
            if (!t.due_at) return false;
            const taskDate = new Date(t.due_at);
            return taskDate >= weekStart && taskDate <= weekEnd;
          })
        };
      });
    }
    
    return [];
  }, [view, tasks, selectedDate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-6">
      {columns.map(column => (
        <div key={column.id} className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Column Header */}
          <div className="p-4 border-b border-border bg-card-hover">
            <h3 className="font-semibold text-foreground mb-1">{column.label}</h3>
            {column.dateRange && (
              <p className="text-xs text-gray-400">{column.dateRange}</p>
            )}
            <span className="text-xs text-gray-400 mt-1 block">{column.tasks.length} tasks</span>
          </div>
          
          {/* Task Cards */}
          <ScrollArea className="h-[600px]">
            <div className="p-3 space-y-3">
              {column.tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No tasks
                </div>
              ) : (
                column.tasks.map(task => (
                  <Card
                    key={task.id}
                    className={cn(
                      "p-3 cursor-pointer transition-all",
                      "hover:bg-card-hover hover:shadow-md hover:border-primary/20"
                    )}
                    onClick={() => onTaskClick(task.id)}
                  >
                    {/* Task Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-medium text-card-foreground flex-1 line-clamp-2">
                        {task.title}
                      </h4>
                      {view !== 'today' && view !== 'day' && (
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", statusColors[task.status])}
                        >
                          {task.status}
                        </Badge>
                      )}
                    </div>

                    {/* Task Metadata */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", priorityColors[task.priority])}
                      >
                        {task.priority}
                      </Badge>
                      
                      {task.due_at && (view === 'today' || view === 'day') && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(task.due_at), 'h:mm a')}
                        </span>
                      )}
                      
                      {task.due_at && (view === 'week' || view === 'month') && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(task.due_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>

                    {/* Task Description Preview */}
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Assignees */}
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {task.assignees.slice(0, 3).map((assignee: any) => (
                          <div 
                            key={assignee.id}
                            className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-medium"
                            title={assignee.name}
                          >
                            {assignee.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        ))}
                        {task.assignees.length > 3 && (
                          <span className="text-xs text-gray-400 ml-1">
                            +{task.assignees.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
};
