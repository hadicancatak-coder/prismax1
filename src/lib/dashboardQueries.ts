import { supabase } from "@/integrations/supabase/client";

export const getDashboardStats = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayRes, overdueRes, inProgressRes, completedThisWeekRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .gte("due_at", today.toISOString())
      .lt("due_at", tomorrow.toISOString())
      .neq("status", "Completed"),
    
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .lt("due_at", today.toISOString())
      .neq("status", "Completed"),
    
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "Ongoing"),
    
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "Completed")
      .gte("updated_at", new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
  ]);

  return {
    today: todayRes.count || 0,
    overdue: overdueRes.count || 0,
    inProgress: inProgressRes.count || 0,
    completedThisWeek: completedThisWeekRes.count || 0,
  };
};

export const getRecentActivity = async (limit = 10) => {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching activity:", error);
    return [];
  }

  // Fetch user profiles separately
  if (data && data.length > 0) {
    const userIds = [...new Set(data.map(log => log.user_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, avatar_url")
      .in("user_id", userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    return data.map(log => ({
      ...log,
      user: profileMap.get(log.user_id)
    }));
  }

  return data || [];
};

export const getUpcomingTasks = async (limit = 5) => {
  const { data } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(name, avatar_url)
    `)
    .neq("status", "Completed")
    .not("due_at", "is", null)
    .order("due_at", { ascending: true })
    .limit(limit);

  return data || [];
};

export const getNeedsAttention = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [overdueTasksRes, blockersRes, pendingApprovalsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .lt("due_at", today.toISOString())
      .neq("status", "Completed")
      .limit(5),
    
    supabase
      .from("blockers")
      .select("*, task:tasks(title)")
      .eq("resolved", false)
      .limit(5),
    
    supabase
      .from("tasks")
      .select("*")
      .eq("pending_approval", true)
      .limit(5)
  ]);

  return {
    overdueTasks: overdueTasksRes.data || [],
    blockers: blockersRes.data || [],
    pendingApprovals: pendingApprovalsRes.data || [],
  };
};
