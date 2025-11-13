import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { statusLogService, StatusLog, StatusLogFilters } from "@/lib/statusLogService";
import { toast } from "@/hooks/use-toast";

export const useStatusLogs = (filters?: StatusLogFilters) => {
  return useQuery({
    queryKey: ["status-logs", filters],
    queryFn: () => statusLogService.getStatusLogs(filters),
  });
};

export const useCreateStatusLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (log: Omit<StatusLog, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'profiles'>) =>
      statusLogService.createStatusLog(log),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-logs"] });
      toast({ title: "Status log created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create status log",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateStatusLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<StatusLog> }) =>
      statusLogService.updateStatusLog(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-logs"] });
      toast({ title: "Status log updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status log",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteStatusLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => statusLogService.deleteStatusLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-logs"] });
      toast({ title: "Status log deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete status log",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useResolveStatusLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => statusLogService.resolveStatusLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-logs"] });
      toast({ title: "Status log marked as resolved" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resolve status log",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useConvertToTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ logId, taskData }: { logId: string; taskData: any }) =>
      statusLogService.convertToTask(logId, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-logs"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Successfully converted to task" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to convert to task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useStatusLogStats = () => {
  return useQuery({
    queryKey: ["status-log-stats"],
    queryFn: () => statusLogService.getStatusLogStats(),
  });
};
