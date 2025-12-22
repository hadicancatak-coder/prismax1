import { useMemo } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayBriefProps {
  tasks: any[];
  allUsers: any[];
  targetDate: Date;
}

interface UserTaskSummary {
  userId: string;
  userName: string;
  dueTasks: string[];
  overdueTasks: string[];
  externalDependencyTasks: string[];
  completedTasks: string[];
}

export function DayBrief({ tasks, allUsers, targetDate }: DayBriefProps) {
  const summaries = useMemo(() => {
    const userMap = new Map<string, UserTaskSummary>();
    
    tasks.forEach(task => {
      if (!task.assignees || task.assignees.length === 0) return;
      
      task.assignees.forEach((assignee: any) => {
        const userId = assignee.user_id || assignee.profiles?.user_id;
        if (!userId) return;
        
        const user = allUsers.find(u => u.user_id === userId);
        const userName = user?.name || user?.email?.split('@')[0] || 'Unknown';
        
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            userName,
            dueTasks: [],
            overdueTasks: [],
            externalDependencyTasks: [],
            completedTasks: [],
          });
        }
        
        const summary = userMap.get(userId)!;
        const taskTitle = task.title;
        
        if (task.status === 'Completed') {
          summary.completedTasks.push(taskTitle);
        } else if (task.is_external_dependency) {
          summary.externalDependencyTasks.push(taskTitle);
        } else if (task.due_at && new Date(task.due_at) < new Date() && task.status !== 'Completed') {
          summary.overdueTasks.push(taskTitle);
        } else {
          summary.dueTasks.push(taskTitle);
        }
      });
    });
    
    return Array.from(userMap.values()).filter(
      s => s.dueTasks.length > 0 || s.overdueTasks.length > 0 || s.externalDependencyTasks.length > 0
    );
  }, [tasks, allUsers]);

  const formatTaskList = (titles: string[]) => {
    if (titles.length === 0) return '';
    if (titles.length === 1) return `**${titles[0]}**`;
    if (titles.length === 2) return `**${titles[0]}** and **${titles[1]}**`;
    const last = titles[titles.length - 1];
    const rest = titles.slice(0, -1);
    return `${rest.map(t => `**${t}**`).join(', ')}, and **${last}**`;
  };

  if (summaries.length === 0) {
    return (
      <Card className="p-4 bg-card border-border rounded-xl mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="text-body text-foreground">
            All clear for <span className="font-medium">{format(targetDate, 'EEEE, MMMM d')}</span>! No pending tasks.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-border rounded-xl mb-6">
      <h2 className="text-heading-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        Day Brief — {format(targetDate, 'EEEE, MMMM d')}
      </h2>
      
      <div className="space-y-3">
        {summaries.map(summary => (
          <div key={summary.userId} className="text-body-sm text-foreground">
            <span className="font-semibold text-primary">{summary.userName}</span>
            
            {/* Due tasks */}
            {summary.dueTasks.length > 0 && (
              <span>
                {' '}has {formatTaskList(summary.dueTasks).replace(/\*\*/g, '')} to be completed
                {summary.overdueTasks.length > 0 || summary.externalDependencyTasks.length > 0 ? '.' : '.'}
              </span>
            )}
            
            {/* Overdue tasks */}
            {summary.overdueTasks.length > 0 && (
              <span className="text-destructive">
                {summary.dueTasks.length > 0 ? ' Also has ' : ' has '}
                <span className="font-medium">{summary.overdueTasks.length}</span> overdue task{summary.overdueTasks.length > 1 ? 's' : ''}: {formatTaskList(summary.overdueTasks).replace(/\*\*/g, '')}.
              </span>
            )}
            
            {/* External dependency tasks */}
            {summary.externalDependencyTasks.length > 0 && (
              <span className="text-warning">
                {' '}Waiting on external party for {formatTaskList(summary.externalDependencyTasks).replace(/\*\*/g, '')}.
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* Stats row */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        {summaries.reduce((acc, s) => acc + s.dueTasks.length, 0) > 0 && (
          <Badge variant="outline" className="text-metadata bg-primary/10 border-primary/30 text-primary">
            <Clock className="h-3 w-3 mr-1" />
            {summaries.reduce((acc, s) => acc + s.dueTasks.length, 0)} pending
          </Badge>
        )}
        {summaries.reduce((acc, s) => acc + s.overdueTasks.length, 0) > 0 && (
          <Badge variant="outline" className="text-metadata bg-destructive/10 border-destructive/30 text-destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {summaries.reduce((acc, s) => acc + s.overdueTasks.length, 0)} overdue
          </Badge>
        )}
        {summaries.reduce((acc, s) => acc + s.externalDependencyTasks.length, 0) > 0 && (
          <Badge variant="outline" className="text-metadata bg-warning/10 border-warning/30 text-warning">
            <ExternalLink className="h-3 w-3 mr-1" />
            {summaries.reduce((acc, s) => acc + s.externalDependencyTasks.length, 0)} waiting
          </Badge>
        )}
      </div>
    </Card>
  );
}
