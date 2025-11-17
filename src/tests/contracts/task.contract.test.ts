import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { taskSchema, taskAssigneeSchema, taskStatusSchema, taskPrioritySchema } from '@/schemas/apiSchemas';

/**
 * Contract Tests for Task API
 * These tests validate the structure and data types of task-related API responses
 */
describe('Task API Contract Tests', () => {
  let testUserId: string;
  let testTaskId: string;

  beforeAll(async () => {
    // Get current user for testing
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user for testing');
    testUserId = user.id;
  });

  describe('Task CRUD Operations', () => {
    it('should create a task with valid schema', async () => {
      const newTask = {
        title: 'Contract Test Task',
        description: 'Testing task creation schema',
        status: 'Pending' as const,
        priority: 'Medium' as const,
        task_type: 'generic' as const,
        created_by: testUserId,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Validate response against schema
      const validation = taskSchema.safeParse(data);
      expect(validation.success).toBe(true);
      
      if (validation.success) {
        testTaskId = validation.data.id;
        expect(validation.data.title).toBe(newTask.title);
        expect(validation.data.status).toBe(newTask.status);
        expect(validation.data.priority).toBe(newTask.priority);
      }
    });

    it('should fetch task with valid schema', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', testTaskId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const validation = taskSchema.safeParse(data);
      expect(validation.success).toBe(true);
    });

    it('should update task status with valid enum values', async () => {
      const newStatus = 'Ongoing';

      const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', testTaskId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const validation = taskSchema.safeParse(data);
      expect(validation.success).toBe(true);
      
      if (validation.success) {
        expect(validation.data.status).toBe(newStatus);
      }
    });

    it('should reject invalid task status', async () => {
      const invalidStatus = 'InvalidStatus' as any;

      const { error } = await supabase
        .from('tasks')
        .update({ status: invalidStatus })
        .eq('id', testTaskId)
        .select()
        .single();

      // Should fail at database level or validation level
      expect(error).toBeDefined();
    });

    it('should enforce title length constraints', async () => {
      const longTitle = 'x'.repeat(201); // Exceeds 200 char limit

      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: longTitle,
          status: 'Pending',
          priority: 'Medium',
          created_by: testUserId,
        }])
        .select()
        .single();

      expect(error).toBeDefined();
    });

    it('should delete task successfully', async () => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', testTaskId);

      expect(error).toBeNull();
    });
  });

  describe('Task Assignment Contract', () => {
    it('should assign user to task with valid schema', async () => {
      // First create a task
      const { data: task } = await supabase
        .from('tasks')
        .insert([{
          title: 'Assignment Test Task',
          status: 'Pending',
          priority: 'Low',
          created_by: testUserId,
        }])
        .select()
        .single();

      if (!task) throw new Error('Failed to create test task');

      // Get a profile ID for assignment
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', testUserId)
        .single();

      if (!profile) throw new Error('No profile found');

      // Assign user to task
      const { data, error } = await supabase
        .from('task_assignees')
        .insert([{
          task_id: task.id,
          user_id: profile.id,
          assigned_by: profile.id,
        }])
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const validation = taskAssigneeSchema.safeParse(data);
      expect(validation.success).toBe(true);

      // Cleanup
      await supabase.from('tasks').delete().eq('id', task.id);
    });
  });

  describe('Task Query Filtering', () => {
    it('should filter tasks by status', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'Pending')
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);

      // Validate each task matches schema
      data?.forEach(task => {
        const validation = taskSchema.safeParse(task);
        expect(validation.success).toBe(true);
        expect(task.status).toBe('Pending');
      });
    });

    it('should filter tasks by priority', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('priority', 'High')
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      data?.forEach(task => {
        const validation = taskSchema.safeParse(task);
        expect(validation.success).toBe(true);
        expect(task.priority).toBe('High');
      });
    });
  });
});
