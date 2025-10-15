import { supabase } from "@/integrations/supabase/client";

export const getDashboardStats = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get user's profile.id from auth user_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) return { today: 0, overdue: 0, inProgress: 0, completedThisWeek: 0 };

  // Get task IDs assigned to this user
  const { data: assignedTasks } = await supabase
    .from("task_assignees")
    .select("task_id")
    .eq("user_id", profile.id);

  const taskIds = assignedTasks?.map(a => a.task_id) || [];

  // If no tasks assigned, return zeros
  if (taskIds.length === 0) {
    return { today: 0, overdue: 0, inProgress: 0, completedThisWeek: 0 };
  }

  const [todayRes, overdueRes, inProgressRes, completedThisWeekRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("id", taskIds)
      .gte("due_at", today.toISOString())
      .lt("due_at", tomorrow.toISOString())
      .neq("status", "Completed"),
    
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("id", taskIds)
      .lt("due_at", today.toISOString())
      .neq("status", "Completed"),
    
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("id", taskIds)
      .eq("status", "Ongoing"),
    
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("id", taskIds)
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

export const getUpcomingTasks = async (userId: string, limit = 5) => {
  // Get user's profile.id from auth user_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) return [];

  // Get task IDs assigned to this user
  const { data: assignedTasks } = await supabase
    .from("task_assignees")
    .select("task_id")
    .eq("user_id", profile.id);

  const taskIds = assignedTasks?.map(a => a.task_id) || [];

  if (taskIds.length === 0) return [];

  // Fetch tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .in("id", taskIds)
    .neq("status", "Completed")
    .not("due_at", "is", null)
    .order("due_at", { ascending: true })
    .limit(limit);

  if (!tasks || tasks.length === 0) return [];

  // Get task assignees with profiles
  const { data: taskAssignees } = await supabase
    .from("task_assignees")
    .select(`
      task_id,
      profiles:user_id (
        user_id,
        name,
        avatar_url
      )
    `)
    .in("task_id", tasks.map(t => t.id));

  // Map assignees to tasks
  const assigneeMap = new Map();
  taskAssignees?.forEach(ta => {
    if (!assigneeMap.has(ta.task_id)) {
      assigneeMap.set(ta.task_id, []);
    }
    assigneeMap.get(ta.task_id).push(ta.profiles);
  });
  
  return tasks.map(task => ({
    ...task,
    assignees: assigneeMap.get(task.id) || []
  }));
};

export const getNeedsAttention = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get user's profile.id from auth user_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    return {
      overdueTasks: [],
      blockers: [],
      pendingApprovals: [],
    };
  }

  // Get task IDs assigned to this user
  const { data: assignedTasks } = await supabase
    .from("task_assignees")
    .select("task_id")
    .eq("user_id", profile.id);

  const taskIds = assignedTasks?.map(a => a.task_id) || [];

  const [overdueTasksRes, blockersRes, pendingApprovalsRes] = await Promise.all([
    taskIds.length > 0
      ? supabase
          .from("tasks")
          .select("*")
          .in("id", taskIds)
          .lt("due_at", today.toISOString())
          .neq("status", "Completed")
          .limit(5)
      : Promise.resolve({ data: [] }),
    
    taskIds.length > 0
      ? supabase
          .from("blockers")
          .select("*, task:tasks(title)")
          .in("task_id", taskIds)
          .eq("resolved", false)
          .limit(5)
      : Promise.resolve({ data: [] }),
    
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
