import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { operationsService } from "@/lib/operationsService";
import { toast } from "@/hooks/use-toast";

export const useOperationLogs = (filters?: {
  platform?: string;
  status?: string;
  entity?: string;
}) => {
  return useQuery({
    queryKey: ["operation-logs", filters],
    queryFn: () => operationsService.getAuditLogs(filters),
  });
};

export const useOperationLog = (id: string) => {
  return useQuery({
    queryKey: ["operation-log", id],
    queryFn: () => operationsService.getAuditLogById(id),
    enabled: !!id,
  });
};

export const useOperationItems = (auditLogId: string) => {
  return useQuery({
    queryKey: ["operation-items", auditLogId],
    queryFn: () => operationsService.getAuditItems(auditLogId),
    enabled: !!auditLogId,
  });
};

export const useCreateOperationLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: operationsService.createAuditLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation-logs"] });
      toast({
        title: "Success",
        description: "Audit log created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCreateOperationItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: operationsService.createAuditItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation-items"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCreateBulkOperationItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: operationsService.createBulkAuditItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation-items"] });
      toast({
        title: "Success",
        description: "Items added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateOperationItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      operationsService.updateAuditItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation-items"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteOperationItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: operationsService.deleteAuditItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation-items"] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useMarkItemComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: operationsService.markItemComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation-items"] });
      toast({
        title: "Success",
        description: "Item marked as complete",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCreateTaskFromItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, auditLogId }: { itemId: string; auditLogId: string }) =>
      operationsService.createTaskFromItem(itemId, auditLogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation-items"] });
      // Realtime subscription in useTasks.ts handles tasks invalidation
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useOperationStats = () => {
  return useQuery({
    queryKey: ["operation-stats"],
    queryFn: operationsService.getAuditStats,
  });
};

export function useUpdateAuditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<any> }) =>
      operationsService.updateAuditLog(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["operation-logs"] });
      queryClient.invalidateQueries({ queryKey: ["operation-log", variables.id] });
      toast({
        title: "Success",
        description: "Audit log updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDefaultAssignees(platform: string | null) {
  return useQuery({
    queryKey: ["default-assignees", platform],
    queryFn: () => platform ? operationsService.getDefaultAssignees(platform) : Promise.resolve({ assignees: [], teamName: '' }),
    enabled: !!platform,
  });
}

export function useDeleteOperationLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: operationsService.deleteAuditLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation-logs"] });
      queryClient.invalidateQueries({ queryKey: ["operation-stats"] });
      toast({
        title: "Success",
        description: "Audit log deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
