import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReportDocument } from "@/types/report";
import { toast } from "@/hooks/use-toast";

export function useCustomReports() {
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["custom-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_reports")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return data.map((report) => ({
        id: report.id,
        name: report.name,
        elements: report.elements as any[],
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      })) as ReportDocument[];
    },
  });

  const createReport = useMutation({
    mutationFn: async (report: Omit<ReportDocument, "createdAt" | "updatedAt">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("custom_reports")
        .insert({
          user_id: user.id,
          name: report.name,
          elements: report.elements as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-reports"] });
      toast({
        title: "Report Created",
        description: "Your report has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateReport = useMutation({
    mutationFn: async (report: ReportDocument) => {
      const { data, error } = await supabase
        .from("custom_reports")
        .update({
          name: report.name,
          elements: report.elements as any,
        })
        .eq("id", report.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-reports"] });
      toast({
        title: "Report Updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("custom_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-reports"] });
      toast({
        title: "Report Deleted",
        description: "The report has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    reports,
    isLoading,
    createReport: createReport.mutate,
    updateReport: updateReport.mutate,
    deleteReport: deleteReport.mutate,
    isCreating: createReport.isPending,
    isUpdating: updateReport.isPending,
    isDeleting: deleteReport.isPending,
  };
}
