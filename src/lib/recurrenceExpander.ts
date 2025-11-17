import { parseISO, isWithinInterval, startOfDay, addDays, isSameDay, format } from 'date-fns';

export interface RecurringOccurrence {
  taskId: string;
  occurrenceDate: Date;
  isCompleted: boolean;
  completionId?: string;
}

/**
 * Expands a recurring task into individual occurrences within a date range
 */
export function expandRecurringTask(
  task: any,
  startDate: Date,
  endDate: Date,
  completions: any[] = []
): RecurringOccurrence[] {
  if (!task.recurrence_rrule || task.task_type !== 'recurring') return [];

  const occurrences: RecurringOccurrence[] = [];
  const rrule = task.recurrence_rrule;

  // Weekly recurrence
  if (rrule.includes('FREQ=WEEKLY') && task.recurrence_days_of_week) {
    let currentDate = startOfDay(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday
      
      if (task.recurrence_days_of_week.includes(dayOfWeek)) {
        const completionDateStr = format(currentDate, 'yyyy-MM-dd');
        const completion = completions.find(c => c.completed_date === completionDateStr);
        
        occurrences.push({
          taskId: task.id,
          occurrenceDate: new Date(currentDate),
          isCompleted: !!completion,
          completionId: completion?.id,
        });
      }
      
      currentDate = addDays(currentDate, 1);
    }
  }

  // Monthly recurrence
  if (rrule.includes('FREQ=MONTHLY') && task.recurrence_day_of_month) {
    let currentDate = new Date(startDate);
    currentDate.setDate(task.recurrence_day_of_month);
    
    while (currentDate <= endDate) {
      if (currentDate >= startDate) {
        const completionDateStr = format(currentDate, 'yyyy-MM-dd');
        const completion = completions.find(c => c.completed_date === completionDateStr);
        
        occurrences.push({
          taskId: task.id,
          occurrenceDate: new Date(currentDate),
          isCompleted: !!completion,
          completionId: completion?.id,
        });
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  // Daily recurrence
  if (rrule.includes('FREQ=DAILY')) {
    let currentDate = startOfDay(startDate);
    
    while (currentDate <= endDate) {
      const completionDateStr = format(currentDate, 'yyyy-MM-dd');
      const completion = completions.find(c => c.completed_date === completionDateStr);
      
      occurrences.push({
        taskId: task.id,
        occurrenceDate: new Date(currentDate),
        isCompleted: !!completion,
        completionId: completion?.id,
      });
      
      currentDate = addDays(currentDate, 1);
    }
  }

  return occurrences;
}

/**
 * Get human-readable recurrence label
 */
export function getRecurrenceLabel(task: any): string {
  if (!task.recurrence_rrule) return '';
  
  const rrule = task.recurrence_rrule;
  
  if (rrule.includes('FREQ=WEEKLY') && task.recurrence_days_of_week) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNames = task.recurrence_days_of_week.map((d: number) => days[d]).join(', ');
    return `Every ${dayNames}`;
  }
  
  if (rrule.includes('FREQ=MONTHLY') && task.recurrence_day_of_month) {
    return `Monthly on day ${task.recurrence_day_of_month}`;
  }
  
  if (rrule.includes('FREQ=DAILY')) {
    return 'Daily';
  }
  
  return 'Recurring';
}
