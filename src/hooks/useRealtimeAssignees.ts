import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  user_id: string;
  name: string;
  username?: string;
}

export function useRealtimeAssignees(
  entityType: "task" | "project" | "campaign" | "blocker",
  entityId: string
) {
  const [assignees, setAssignees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignees = async () => {
    let data: any = null;

    if (entityType === "task") {
      const result = await supabase
        .from("task_assignees")
        .select("user_id")
        .eq("task_id", entityId);
      data = result.data;
    } else if (entityType === "project") {
      const result = await supabase
        .from("project_assignees")
        .select("user_id")
        .eq("project_id", entityId);
      data = result.data;
    } else if (entityType === "campaign") {
      const result = await supabase
        .from("campaign_assignees")
        .select("user_id")
        .eq("campaign_id", entityId);
      data = result.data;
    } else if (entityType === "blocker") {
      const result = await supabase
        .from("blocker_assignees")
        .select("user_id")
        .eq("blocker_id", entityId);
      data = result.data;
    }

    if (data && data.length > 0) {
      const profileIds = data.map((d: any) => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, name, username")
        .in("id", profileIds);

      setAssignees(profiles || []);
    } else {
      setAssignees([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignees();

    const tableName =
      entityType === "task"
        ? "task_assignees"
        : entityType === "project"
        ? "project_assignees"
        : entityType === "campaign"
        ? "campaign_assignees"
        : "blocker_assignees";

    const filterColumn =
      entityType === "task"
        ? "task_id"
        : entityType === "project"
        ? "project_id"
        : entityType === "campaign"
        ? "campaign_id"
        : "blocker_id";

    const channel = supabase
      .channel(`${entityType}-assignees-${entityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tableName,
          filter: `${filterColumn}=eq.${entityId}`,
        },
        () => {
          fetchAssignees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityType, entityId]);

  return { assignees, loading, refetch: fetchAssignees };
}