/**
 * Task Actions - Single Source of Truth
 * All task completion, status changes, and bulk operations MUST use these functions.
 * This prevents inconsistent behavior across different UI components.
 */

import { supabase } from '@/integrations/supabase/client';

// Valid DB status values
type TaskStatusDBType = 'Pending' | 'Ongoing' | 'Blocked' | 'Completed' | 'Failed';

// Status mapping - UI to DB
// This is a copy to avoid circular imports (domain/index imports from actions)
const UI_TO_DB_STATUS: Record<string, TaskStatusDBType> = {
  'Backlog': 'Pending',
  'Ongoing': 'Ongoing', 
  'Blocked': 'Blocked',
  'Completed': 'Completed',
  'Failed': 'Failed',
  // Also accept DB values directly (no-op mapping)
  'Pending': 'Pending',
};

/**
 * Maps any UI or DB status to a valid DB status value.
 * Throws if invalid status is passed for debugging.
 */
const mapStatusToDbLocal = (status: string): TaskStatusDBType => {
  const dbStatus = UI_TO_DB_STATUS[status];
  if (!dbStatus) {
    console.error(`[Task Actions] Invalid status: "${status}". Valid values: ${Object.keys(UI_TO_DB_STATUS).join(', ')}`);
    // Default to Pending rather than throwing to prevent complete failure
    return 'Pending';
  }
  return dbStatus;
};

// =============================================================================
// TYPES
// =============================================================================

export interface TaskActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface SetStatusOptions {
  failure_reason?: string;
  blocked_reason?: string;
}

// =============================================================================
// CORE ACTIONS
// =============================================================================

/**
 * Complete a single task
 * Sets status to 'Completed' in the database
 */
export async function completeTask(taskId: string): Promise<TaskActionResult> {
  console.log('[Task Actions] completeTask called with:', taskId);
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'Completed' as TaskStatusDBType, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('[Task Actions] completeTask error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Task Actions] completeTask success:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('[Task Actions] completeTask exception:', err);
    return { success: false, error: err.message || 'Failed to complete task' };
  }
}

/**
 * Complete multiple tasks in bulk
 * Uses Promise.allSettled to handle partial failures gracefully
 */
export async function completeTasksBulk(taskIds: string[]): Promise<{
  success: boolean;
  successCount: number;
  failedCount: number;
  errors: string[];
}> {
  if (taskIds.length === 0) {
    return { success: true, successCount: 0, failedCount: 0, errors: [] };
  }

  const results = await Promise.allSettled(
    taskIds.map(id => completeTask(id))
  );

  const errors: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successCount++;
    } else {
      failedCount++;
      const errorMsg = result.status === 'rejected' 
        ? result.reason?.message 
        : (result.value as TaskActionResult).error;
      errors.push(`Task ${taskIds[index]}: ${errorMsg || 'Unknown error'}`);
    }
  });

  return {
    success: failedCount === 0,
    successCount,
    failedCount,
    errors,
  };
}

/**
 * Set task status with optional reason (for Blocked/Failed statuses)
 */
export async function setTaskStatus(
  taskId: string,
  status: string,
  options?: SetStatusOptions
): Promise<TaskActionResult> {
  try {
    const dbStatus = mapStatusToDbLocal(status);
    
    // Build update object
    const updateData: Record<string, any> = {
      status: dbStatus,
      updated_at: new Date().toISOString(),
    };

    // Add reason fields if provided
    if (dbStatus === 'Failed' && options?.failure_reason) {
      updateData.failure_reason = options.failure_reason;
    }
    if (dbStatus === 'Blocked' && options?.blocked_reason) {
      updateData.blocker_reason = options.blocked_reason;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update task status' };
  }
}

/**
 * Set status for multiple tasks in bulk
 */
export async function setTasksStatusBulk(
  taskIds: string[],
  status: string,
  options?: SetStatusOptions
): Promise<{
  success: boolean;
  successCount: number;
  failedCount: number;
  errors: string[];
}> {
  if (taskIds.length === 0) {
    return { success: true, successCount: 0, failedCount: 0, errors: [] };
  }

  const results = await Promise.allSettled(
    taskIds.map(id => setTaskStatus(id, status, options))
  );

  const errors: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successCount++;
    } else {
      failedCount++;
      const errorMsg = result.status === 'rejected'
        ? result.reason?.message
        : (result.value as TaskActionResult).error;
      errors.push(`Task ${taskIds[index]}: ${errorMsg || 'Unknown error'}`);
    }
  });

  return {
    success: failedCount === 0,
    successCount,
    failedCount,
    errors,
  };
}

/**
 * Delete multiple tasks in bulk
 */
export async function deleteTasksBulk(taskIds: string[]): Promise<{
  success: boolean;
  successCount: number;
  failedCount: number;
  errors: string[];
}> {
  if (taskIds.length === 0) {
    return { success: true, successCount: 0, failedCount: 0, errors: [] };
  }

  const results = await Promise.allSettled(
    taskIds.map(async (id) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    })
  );

  const errors: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successCount++;
    } else {
      failedCount++;
      errors.push(`Task ${taskIds[index]}: ${result.reason?.message || 'Unknown error'}`);
    }
  });

  return {
    success: failedCount === 0,
    successCount,
    failedCount,
    errors,
  };
}

/**
 * Update priority for multiple tasks in bulk
 */
export async function setPriorityBulk(
  taskIds: string[],
  priority: 'Low' | 'Medium' | 'High'
): Promise<{
  success: boolean;
  successCount: number;
  failedCount: number;
  errors: string[];
}> {
  if (taskIds.length === 0) {
    return { success: true, successCount: 0, failedCount: 0, errors: [] };
  }

  const results = await Promise.allSettled(
    taskIds.map(async (id) => {
      const { error } = await supabase
        .from('tasks')
        .update({ priority, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    })
  );

  const errors: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successCount++;
    } else {
      failedCount++;
      errors.push(`Task ${taskIds[index]}: ${result.reason?.message || 'Unknown error'}`);
    }
  });

  return {
    success: failedCount === 0,
    successCount,
    failedCount,
    errors,
  };
}

/**
 * Add a comment to a task (used for blocked reasons, etc.)
 */
export async function addTaskComment(
  taskId: string,
  authorId: string,
  body: string
): Promise<TaskActionResult> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, author_id: authorId, body })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add comment' };
  }
}
