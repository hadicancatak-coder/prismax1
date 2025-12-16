import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef, useState } from "react";

interface CompletedTask {
  id: string;
  title: string;
  updated_at: string;
  completed_by: string | null;
}

export function RecentlyCompletedTicker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const { data: tasks } = useQuery({
    queryKey: ["recently-completed-ticker"],
    queryFn: async () => {
      const { data: completedTasks, error } = await supabase
        .from("tasks")
        .select("id, title, updated_at")
        .eq("status", "Completed")
        .order("updated_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get user names for completed tasks
      const tasksWithUsers: CompletedTask[] = [];
      for (const task of completedTasks || []) {
        const { data: assignees } = await supabase
          .from("task_assignees")
          .select("profiles!inner(name)")
          .eq("task_id", task.id)
          .limit(1);

        tasksWithUsers.push({
          ...task,
          completed_by: (assignees?.[0] as any)?.profiles?.name || null,
        });
      }

      return tasksWithUsers;
    },
  });

  const truncateTitle = (title: string, maxLength = 30) => {
    return title.length > maxLength ? title.slice(0, maxLength) + "..." : title;
  };

  if (!tasks || tasks.length === 0) {
    return null;
  }

  // Duplicate items for seamless loop
  const items = [...tasks, ...tasks];

  return (
    <div className="bg-elevated rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span className="text-xs font-medium text-muted-foreground">Recently Completed</span>
      </div>
      
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={contentRef}
          className={`flex gap-6 py-3 px-4 ${isPaused ? "" : "animate-ticker"}`}
          style={{
            width: "max-content",
          }}
        >
          {items.map((task, index) => (
            <div
              key={`${task.id}-${index}`}
              className="flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <span className="text-foreground font-medium">
                {truncateTitle(task.title)}
              </span>
              {task.completed_by && (
                <span className="text-muted-foreground">
                  by {task.completed_by}
                </span>
              )}
              <span className="text-muted-foreground/60 text-xs">
                {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
              </span>
              <span className="text-border">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
