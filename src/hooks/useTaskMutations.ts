import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Task mutation hooks with optimistic updates for instant UI feedback

interface UpdateTaskParams {
  id: string;
  updates: Partial<{
    status: 'Backlog' | 'Ongoing' | 'Completed' | 'Failed' | 'Blocked';
    priority: 'Low' | 'Medium' | 'High';
    due_at: string | null;
    title: string;
    description: string;
    [key: string]: any;
  }>;
}

export const useTaskMutations = () => {
  const queryClient = useQueryClient();

  // Main update mutation with optimistic updates
  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: UpdateTaskParams) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // Optimistically update cache
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return old;
        return old.map((task: any) =>
          task.id === id ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
        );
      });
      
      return { previousTasks };
    },
    onError: (err: any, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({
        title: "Update failed",
        description: err.message || "Failed to update task",
        variant: "destructive"
      });
    },
    onSuccess: (data, variables) => {
      // Show success message for non-silent updates
      const updateType = variables.updates.status ? 'Status' : 
                        variables.updates.priority ? 'Priority' : 
                        variables.updates.due_at ? 'Deadline' : 'Task';
      
      toast({ 
        title: `${updateType} updated`,
        duration: 2000
      });
    },
    onSettled: () => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Helper mutation for completing tasks
  const completeTask = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: 'Completed' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return old;
        return old.map((task: any) =>
          task.id === id ? { ...task, status: 'Completed', updated_at: new Date().toISOString() } : task
        );
      });
      
      return { previousTasks };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({
        title: "Failed to complete task",
        description: err.message,
        variant: "destructive"
      });
    },
    onSuccess: () => {
      toast({ title: "Task completed", duration: 2000 });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Helper mutation for updating deadline
  const updateDeadline = useMutation({
    mutationFn: async ({ id, due_at }: { id: string; due_at: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ due_at })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, due_at }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return old;
        return old.map((task: any) =>
          task.id === id ? { ...task, due_at, updated_at: new Date().toISOString() } : task
        );
      });
      
      return { previousTasks };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({
        title: "Failed to update deadline",
        description: err.message,
        variant: "destructive"
      });
    },
    onSuccess: () => {
      toast({ title: "Deadline updated", duration: 2000 });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Helper mutation for updating status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return old;
        return old.map((task: any) =>
          task.id === id ? { ...task, status, updated_at: new Date().toISOString() } : task
        );
      });
      
      return { previousTasks };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({
        title: "Failed to update status",
        description: err.message,
        variant: "destructive"
      });
    },
    onSuccess: () => {
      toast({ title: "Status updated", duration: 2000 });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Helper mutation for updating priority
  const updatePriority = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: any }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ priority })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, priority }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      queryClient.setQueryData(['tasks'], (old: any) => {
        if (!old) return old;
        return old.map((task: any) =>
          task.id === id ? { ...task, priority, updated_at: new Date().toISOString() } : task
        );
      });
      
      return { previousTasks };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast({
        title: "Failed to update priority",
        description: err.message,
        variant: "destructive"
      });
    },
    onSuccess: () => {
      toast({ title: "Priority updated", duration: 2000 });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  return { 
    updateTask, 
    completeTask, 
    updateDeadline, 
    updateStatus, 
    updatePriority 
  };
};
