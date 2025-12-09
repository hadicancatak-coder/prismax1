import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { realtimeService } from "@/lib/realtimeService";
import { mapStatusToUi } from "@/lib/taskStatusMapper";

export interface TaskFilters {
  assignees?: string[];
  teams?: string[];
  dateFilter?: {
    label: string;
    startDate: Date;
    endDate: Date;
  } | null;
  status?: string;
  search?: string;
}

export function useTasks(filters?: TaskFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchTasks = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        task_assignees(
          user_id,
          profiles!task_assignees_user_id_fkey(id, user_id, name, avatar_url, teams, working_days)
        ),
        task_comment_counts(comment_count)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map tasks and include comments count, transform DB status → UI status
    return (data || []).map((task: any) => ({
      ...task,
      status: mapStatusToUi(task.status),
      assignees: task.task_assignees?.map((ta: any) => ta.profiles).filter(Boolean) || [],
      comments_count: task.task_comment_counts?.[0]?.comment_count || 0
    }));
  };

  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  // Setup realtime subscription using centralized service
  useEffect(() => {
    if (!user) return;

    const unsubscribe = realtimeService.subscribe('tasks', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    return () => {
      unsubscribe();
    };
  }, [user, queryClient]);

  return query;
}
