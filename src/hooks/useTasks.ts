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
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

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
          user_id,
          profiles!task_assignees_user_id_fkey(id, user_id, name, avatar_url, teams, working_days)
        ),
        task_comment_counts(comment_count)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map tasks and include comments count, transform DB status → UI status
    const allTasks = (data || []).map((task: any) => {
      return {
        ...task,
        status: mapStatusToUi(task.status), // Transform Pending → Backlog
        assignees: task.task_assignees?.map((ta: any) => ta.profiles).filter(Boolean) || [],
        comments_count: task.task_comment_counts?.[0]?.comment_count || 0
      };
    });

    // Filter tasks based on visibility settings
    return allTasks.filter((task: any) => {
      // Admins always see everything
      if (userRole === 'admin') return true;
      
      // Global visibility tasks are visible to everyone
      if (task.visibility === 'global') return true;
      
      // For private tasks, check if user is assigned or part of team
      const isDirectAssignee = task.assignees?.some((a: any) => a.user_id === user.id);
      const userTeams = currentProfile?.teams || [];
      const taskTeams = Array.isArray(task.teams) 
        ? task.teams 
        : (typeof task.teams === 'string' ? JSON.parse(task.teams) : []);
      const isTeamMember = userTeams.some((team: string) => taskTeams.includes(team));
      
      return isDirectAssignee || isTeamMember;
    });
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
