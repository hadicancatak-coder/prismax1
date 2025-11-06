import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

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
          profiles:user_id(id, user_id, name, avatar_url, teams)
        ),
        task_comment_counts(comment_count)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map tasks and include comments count
    const allTasks = (data || []).map((task: any) => {
      return {
        ...task,
        assignees: task.task_assignees?.map((ta: any) => ta.profiles).filter(Boolean) || [],
        comments_count: task.task_comment_counts?.[0]?.comment_count || 0
      };
    });

    // Filter tasks where user is either direct assignee or team member
    return allTasks.filter((task: any) => {
      const isDirectAssignee = task.assignees?.some((a: any) => a.user_id === user.id);
      
      const userTeams = currentProfile?.teams || [];
      const taskTeams = Array.isArray(task.teams) 
        ? task.teams 
        : (typeof task.teams === 'string' ? JSON.parse(task.teams) : []);
      
      const isTeamMember = userTeams.some((team: string) => taskTeams.includes(team));
      
      return userRole === 'admin' || isDirectAssignee || isTeamMember;
    });
  };

  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          // Refetch tasks on any change
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}
