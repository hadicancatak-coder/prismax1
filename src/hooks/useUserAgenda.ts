import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfDay, isSameDay } from 'date-fns';
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
  const [profileId, setProfileId] = useState<string | null>(null);

  // Fetch user's profile ID once
  useEffect(() => {
    if (!effectiveUserId) return;
    
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', effectiveUserId)
        .single();
      
      if (data) {
        setProfileId(data.id);
      }
    };
    
    fetchProfile();
  }, [effectiveUserId]);

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

  // Check if user is assigned to a task
  const isUserAssigned = useCallback((task: any) => {
    if (!task.assignees || task.assignees.length === 0) return false;
    
    return task.assignees.some((a: any) => {
      // Check multiple possible ID matches
      if (a.user_id === effectiveUserId) return true;
      if (a.id === profileId) return true;
      // Also check if profile's user_id matches
      if (a.user_id && a.user_id === effectiveUserId) return true;
      return false;
    });
  }, [effectiveUserId, profileId]);

  // Check if a recurring task occurs on the selected date
  const recurringTaskOccursOnDate = useCallback((task: any, targetDate: Date) => {
    if (!task.recurrence_rrule) return false;
    
    const dateStart = startOfDay(targetDate);
    const dateEnd = new Date(dateStart);
    dateEnd.setHours(23, 59, 59, 999);
    
    try {
      const occurrences = expandRecurringTask(
        task,
        dateStart,
        dateEnd,
        completions.filter(c => c.task_id === task.id),
        task.assignees || []
      );
      
      return occurrences.length > 0;
    } catch (error) {
      console.error('Error expanding recurring task:', task.id, error);
      return false;
    }
  }, [completions]);

  // Auto-populate agenda based on rules
  const autoPopulateAgenda = useCallback(async () => {
    if (!effectiveUserId || !allTasks?.length || !profileId) return;

    const today = startOfDay(new Date());
    const selectedDateStart = startOfDay(date);
    const isToday = isSameDay(selectedDateStart, today);
    
    const tasksToAdd: { task_id: string; is_auto_added: boolean }[] = [];
    const existingTaskIds = new Set(agendaItems.map(item => item.task_id));

    for (const task of allTasks) {
      // Skip if already in agenda
      if (existingTaskIds.has(task.id)) continue;
      
      // Skip completed, failed, or backlog tasks
      if (task.status === 'Completed' || task.status === 'Failed' || task.status === 'Backlog') continue;
      
      // Check if user is assigned to this task
      const assigned = isUserAssigned(task);
      if (!assigned) continue;

      // RULE: Recurring tasks - check if they occur on the selected date
      // This should be checked FIRST and always auto-add if recurring on this date
      const hasRecurrence = task.task_type === 'recurring' || task.recurrence_rrule;
      if (hasRecurrence && task.recurrence_rrule) {
        const occursToday = recurringTaskOccursOnDate(task, date);
        if (occursToday) {
          tasksToAdd.push({ task_id: task.id, is_auto_added: true });
          continue;
        }
      }

      // RULE: Task due on the selected date
      if (task.due_at) {
        const taskDueDate = startOfDay(new Date(task.due_at));
        
        // If viewing today and task is overdue or due today
        if (isToday && taskDueDate <= today) {
          tasksToAdd.push({ task_id: task.id, is_auto_added: true });
          continue;
        }
        
        // If task is due on the selected date (future dates)
        if (isSameDay(taskDueDate, selectedDateStart)) {
          tasksToAdd.push({ task_id: task.id, is_auto_added: true });
          continue;
        }
      }

      // RULE: High priority tasks - auto add to today only
      if (isToday && task.priority === 'High') {
        tasksToAdd.push({ task_id: task.id, is_auto_added: true });
        continue;
      }
    }

    // Bulk insert new auto-populated items
    if (tasksToAdd.length > 0) {
      console.log('Auto-adding tasks to agenda:', tasksToAdd.map(t => t.task_id));
      
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
      
      if (error) {
        console.error('Error auto-populating agenda:', error);
      } else {
        refetch();
      }
    }
  }, [effectiveUserId, agendaDate, allTasks, agendaItems, date, profileId, isUserAssigned, recurringTaskOccursOnDate, refetch]);

  // Run auto-populate when dependencies change
  useEffect(() => {
    if (effectiveUserId && allTasks?.length > 0 && profileId) {
      autoPopulateAgenda();
    }
  }, [effectiveUserId, agendaDate, allTasks?.length, profileId]);

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

  // Get tasks that are in the agenda (including recurring task instances)
  const agendaTasks = useMemo(() => {
    if (!allTasks) return [];
    
    const agendaTaskIds = new Set(agendaItems.map(item => item.task_id));
    const result: any[] = [];
    const addedIds = new Set<string>();
    
    // Add tasks that are in the agenda
    for (const task of allTasks) {
      if (agendaTaskIds.has(task.id) && !addedIds.has(task.id)) {
        result.push(task);
        addedIds.add(task.id);
      }
    }
    
    // Also include recurring tasks that occur today but might not be in agenda yet
    // (for immediate display before auto-populate runs)
    for (const task of allTasks) {
      if (addedIds.has(task.id)) continue;
      if (task.status === 'Completed' || task.status === 'Failed' || task.status === 'Backlog') continue;
      if (!isUserAssigned(task)) continue;
      
      const hasRecurrence = task.task_type === 'recurring' || task.recurrence_rrule;
      if (hasRecurrence && task.recurrence_rrule) {
        const occursToday = recurringTaskOccursOnDate(task, date);
        if (occursToday) {
          result.push({ ...task, isRecurringOccurrence: true });
          addedIds.add(task.id);
        }
      }
    }
    
    return result;
  }, [allTasks, agendaItems, date, isUserAssigned, recurringTaskOccursOnDate]);

  // Get tasks available to add (assigned to user but not in agenda)
  const availableTasks = useMemo(() => {
    if (!allTasks || !effectiveUserId) return [];
    
    const agendaTaskIds = new Set(agendaTasks.map(t => t.id));
    
    return allTasks.filter(task => {
      // Not already in agenda
      if (agendaTaskIds.has(task.id)) return false;
      
      // Not completed/failed/backlog
      if (task.status === 'Completed' || task.status === 'Failed' || task.status === 'Backlog') return false;
      
      // Must be assigned to user or global/unassigned
      const assigned = isUserAssigned(task);
      const isGlobalUnassigned = task.visibility === 'global' && (!task.assignees || task.assignees.length === 0);
      
      return assigned || isGlobalUnassigned;
    });
  }, [allTasks, agendaTasks, effectiveUserId, isUserAssigned]);

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
