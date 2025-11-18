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

  // Weekly recurrence - parse BYDAY from RRULE
  if (rrule.includes('FREQ=WEEKLY')) {
    let daysOfWeek: number[] = [];
    
    // Parse BYDAY from RRULE (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR")
    if (rrule.includes('BYDAY=')) {
      const match = rrule.match(/BYDAY=([A-Z,]+)/);
      if (match) {
        const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
        daysOfWeek = match[1].split(',').map(d => dayMap[d]).filter(d => d !== undefined);
      }
    } else if (task.recurrence_day_of_week !== null && task.recurrence_day_of_week !== undefined) {
      // Fallback to legacy single day
      daysOfWeek = [task.recurrence_day_of_week];
    }
    
    if (daysOfWeek.length > 0) {
      let currentDate = startOfDay(startDate);
      
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday
        
        if (daysOfWeek.includes(dayOfWeek)) {
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
  
  if (rrule.includes('FREQ=WEEKLY')) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let daysOfWeek: number[] = [];
    
    // Parse BYDAY from RRULE
    if (rrule.includes('BYDAY=')) {
      const match = rrule.match(/BYDAY=([A-Z,]+)/);
      if (match) {
        const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
        daysOfWeek = match[1].split(',').map(d => dayMap[d]).filter(d => d !== undefined);
      }
    } else if (task.recurrence_day_of_week !== null && task.recurrence_day_of_week !== undefined) {
      daysOfWeek = [task.recurrence_day_of_week];
    }
    
    if (daysOfWeek.length > 0) {
      const dayNames = daysOfWeek.map(d => days[d]).join(', ');
      return `Every ${dayNames}`;
    }
  }
  
  if (rrule.includes('FREQ=MONTHLY') && task.recurrence_day_of_month) {
    return `Monthly on day ${task.recurrence_day_of_month}`;
  }
  
  if (rrule.includes('FREQ=DAILY')) {
    return 'Daily';
  }
  
  return 'Recurring';
}
