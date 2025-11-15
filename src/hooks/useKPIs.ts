import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { TeamKPI, KPITarget, KPIAssignment } from "@/types/kpi";

export function useKPIs() {
  const queryClient = useQueryClient();

  const { data: kpis, isLoading } = useQuery({
    queryKey: ["kpis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kpis")
        .select(`
          *,
          targets:kpi_targets(*),
          assignments:kpi_assignments(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as (TeamKPI & { targets: KPITarget[]; assignments: KPIAssignment[] })[];
    },
  });

  const createKPI = useMutation({
    mutationFn: async (kpi: Partial<TeamKPI> & { targets: Partial<KPITarget>[] }) => {
      const { targets, ...kpiData } = kpi;
      
      const { data: newKPI, error: kpiError } = await supabase
        .from("kpis")
        .insert(kpiData as any)
        .select()
        .single();

      if (kpiError) throw kpiError;

      if (targets && targets.length > 0) {
        const targetsData = targets.map(t => ({ ...t, kpi_id: (newKPI as any).id }));
        const { error: targetsError } = await supabase
          .from("kpi_targets")
          .insert(targetsData as any);

        if (targetsError) throw targetsError;
      }

      return newKPI;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      toast({ title: "Success", description: "KPI created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateKPI = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamKPI> & { id: string }) => {
      const { error } = await supabase
        .from("kpis")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      toast({ title: "Success", description: "KPI updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteKPI = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("kpis")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      toast({ title: "Success", description: "KPI deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const assignKPI = useMutation({
    mutationFn: async (assignment: Partial<KPIAssignment>) => {
      // Get the profile ID for assigned_by (current user doing the assignment)
      const { data: assignedByProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", assignment.assigned_by!)
        .single();

      if (!assignedByProfile) throw new Error("Assigner profile not found");

      let finalAssignment: any = {
        ...assignment,
        assigned_by: assignedByProfile.id,
      };

      // If assigning to a user (not a team), convert user_id to profile ID
      if (assignment.user_id) {
        const { data: assignedUserProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", assignment.user_id)
          .single();

        if (!assignedUserProfile) throw new Error("Assigned user profile not found");
        
        finalAssignment.user_id = assignedUserProfile.id;
        finalAssignment.team_name = null;
      } else if (assignment.team_name) {
        // Team assignment
        finalAssignment.user_id = null;
      }

      const { error } = await supabase
        .from("kpi_assignments")
        .insert(finalAssignment);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      toast({ title: "Success", description: "KPI assigned successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateAssignmentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("kpi_assignments")
        .update({ status } as any)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      toast({ title: "Success", description: "Assignment status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    kpis: kpis || [],
    isLoading,
    createKPI,
    updateKPI,
    deleteKPI,
    assignKPI,
    updateAssignmentStatus,
  };
}
