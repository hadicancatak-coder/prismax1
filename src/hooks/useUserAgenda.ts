import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfDay } from 'date-fns';
import { expandRecurringTask } from '@/lib/recurrenceExpander';

interface AgendaItem {
  id: string;
  user_id: string;
  task_id: string;
  agenda_date: string;
  is_auto_added: boolean;
  added_at: string;
  created_at: string;
}

interface UseUserAgendaOptions {
  userId?: string;
  date: Date;
  allTasks: any[];
  completions: any[];
}

export function useUserAgenda({ userId, date, allTasks, completions }: UseUserAgendaOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const effectiveUserId = userId || user?.id;
  const agendaDate = format(date, 'yyyy-MM-dd');

  // Fetch agenda items for user on specific date
  const { data: agendaItems = [], isLoading, refetch } = useQuery({
    queryKey: ['user-agenda', effectiveUserId, agendaDate],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      
      const { data, error } = await supabase
        .from('user_agenda')
        .select('*')
        .eq('user_id', effectiveUserId)
        .eq('agenda_date', agendaDate);
      
      if (error) {
        console.error('Error fetching agenda:', error);
        return [];
      }
      
      return data as AgendaItem[];
    },
    enabled: !!effectiveUserId,
  });

  // Auto-populate agenda based on rules
  const autoPopulateAgenda = useCallback(async () => {
    if (!effectiveUserId || !allTasks?.length) return;

    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
    const isToday = agendaDate === today;
    
    // Get user's profile to find their profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', effectiveUserId)
      .single();
    
    if (!profile) return;
    
    const profileId = profile.id;
    const tasksToAdd: { task_id: string; is_auto_added: boolean }[] = [];
    const existingTaskIds = new Set(agendaItems.map(item => item.task_id));

    allTasks.forEach(task => {
      // Skip if already in agenda
      if (existingTaskIds.has(task.id)) return;
      
      // Skip completed tasks
      if (task.status === 'Completed' || task.status === 'Failed') return;
      
      // Check if user is assigned to this task
      const isAssigned = task.assignees?.some((a: any) => 
        a.id === profileId || a.user_id === effectiveUserId
      );
      
      if (!isAssigned) return;

      // Rule 1: Due on this date - auto add
      if (task.due_at) {
        const taskDueDate = format(new Date(task.due_at), 'yyyy-MM-dd');
        if (taskDueDate === agendaDate) {
          tasksToAdd.push({ task_id: task.id, is_auto_added: true });
          return;
        }
      }

      // Rule 2: High priority tasks - auto add to today only
      if (isToday && task.priority === 'High') {
        tasksToAdd.push({ task_id: task.id, is_auto_added: true });
        return;
      }

      // Rule 3: Recurring tasks - check if they occur on this date
      if ((task.task_type === 'recurring' || task.recurrence_rrule) && task.recurrence_rrule) {
        const dateStart = startOfDay(date);
        const dateEnd = new Date(dateStart);
        dateEnd.setHours(23, 59, 59, 999);
        
        const occurrences = expandRecurringTask(
          task,
          dateStart,
          dateEnd,
          completions.filter(c => c.task_id === task.id),
          task.assignees || []
        );
        
        if (occurrences.length > 0) {
          tasksToAdd.push({ task_id: task.id, is_auto_added: true });
        }
      }
    });

    // Bulk insert new auto-populated items
    if (tasksToAdd.length > 0) {
      const { error } = await supabase
        .from('user_agenda')
        .upsert(
          tasksToAdd.map(item => ({
            user_id: effectiveUserId,
            task_id: item.task_id,
            agenda_date: agendaDate,
            is_auto_added: item.is_auto_added,
          })),
          { onConflict: 'user_id,task_id,agenda_date' }
        );
      
      if (!error) {
        refetch();
      }
    }
  }, [effectiveUserId, agendaDate, allTasks, agendaItems, completions, date, refetch]);

  // Run auto-populate when dependencies change
  useEffect(() => {
    if (effectiveUserId && allTasks?.length > 0) {
      autoPopulateAgenda();
    }
  }, [effectiveUserId, agendaDate, allTasks?.length]);

  // Add tasks to agenda
  const addToAgenda = useMutation({
    mutationFn: async (taskIds: string[]) => {
      if (!effectiveUserId) throw new Error('No user');
      
      const items = taskIds.map(task_id => ({
        user_id: effectiveUserId,
        task_id,
        agenda_date: agendaDate,
        is_auto_added: false,
      }));
      
      const { error } = await supabase
        .from('user_agenda')
        .upsert(items, { onConflict: 'user_id,task_id,agenda_date' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-agenda', effectiveUserId, agendaDate] });
    },
  });

  // Remove from agenda
  const removeFromAgenda = useMutation({
    mutationFn: async (taskIds: string[]) => {
      if (!effectiveUserId) throw new Error('No user');
      
      const { error } = await supabase
        .from('user_agenda')
        .delete()
        .eq('user_id', effectiveUserId)
        .eq('agenda_date', agendaDate)
        .in('task_id', taskIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-agenda', effectiveUserId, agendaDate] });
    },
  });

  // Get tasks that are in the agenda
  const agendaTasks = useMemo(() => {
    if (!allTasks || !agendaItems.length) return [];
    
    const agendaTaskIds = new Set(agendaItems.map(item => item.task_id));
    return allTasks.filter(task => agendaTaskIds.has(task.id));
  }, [allTasks, agendaItems]);

  // Get tasks available to add (assigned to user but not in agenda)
  const availableTasks = useMemo(() => {
    if (!allTasks || !effectiveUserId) return [];
    
    const agendaTaskIds = new Set(agendaItems.map(item => item.task_id));
    
    return allTasks.filter(task => {
      // Not already in agenda
      if (agendaTaskIds.has(task.id)) return false;
      
      // Not completed/failed
      if (task.status === 'Completed' || task.status === 'Failed') return false;
      
      // Must be assigned to user or global/unassigned
      const profile = task.assignees?.find((a: any) => a.user_id === effectiveUserId);
      const isGlobalUnassigned = task.visibility === 'global' && (!task.assignees || task.assignees.length === 0);
      
      return profile || isGlobalUnassigned;
    });
  }, [allTasks, agendaItems, effectiveUserId]);

  return {
    agendaItems,
    agendaTasks,
    availableTasks,
    isLoading,
    addToAgenda: addToAgenda.mutate,
    removeFromAgenda: removeFromAgenda.mutate,
    isAdding: addToAgenda.isPending,
    isRemoving: removeFromAgenda.isPending,
    refetch,
  };
}
