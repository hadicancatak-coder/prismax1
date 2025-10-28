import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";

export interface OperationAuditLog {
  id: string;
  title: string;
  description?: string;
  entity: string[];
  platform: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deadline?: string;
  status: 'in_progress' | 'completed' | 'archived';
}

export interface OperationAuditItem {
  id: string;
  audit_log_id: string;
  content: string;
  status: 'pending' | 'completed' | 'failed';
  assigned_to?: string;
  task_id?: string;
  completed_by?: string;
  completed_at?: string;
  created_at: string;
  order_index: number;
  profiles?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface PlatformTeamMapping {
  id: string;
  platform: string;
  team_name: string;
  default_assignees: string[];
}

class OperationsService {
  async getAuditLogs(filters?: {
    platform?: string;
    status?: string;
    entity?: string;
  }) {
    try {
      let query = supabase
        .from('operation_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.platform) {
        query = query.eq('platform', filters.platform);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.entity) {
        query = query.contains('entity', [filters.entity]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as OperationAuditLog[];
    } catch (error) {
      logger.error('Error fetching audit logs', error);
      return [];
    }
  }

  async getAuditLogById(id: string) {
    try {
      const { data, error } = await supabase
        .from('operation_audit_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as OperationAuditLog;
    } catch (error) {
      logger.error('Error fetching audit log', error);
      return null;
    }
  }

  async createAuditLog(log: {
    title: string;
    description?: string;
    entity: string[];
    platform: string;
    deadline?: string;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('operation_audit_logs')
        .insert({
          ...log,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as OperationAuditLog;
    } catch (error) {
      logger.error('Error creating audit log', error);
      throw error;
    }
  }

  async updateAuditLog(id: string, updates: Partial<OperationAuditLog>) {
    try {
      const { data, error } = await supabase
        .from('operation_audit_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating audit log', error);
      throw error;
    }
  }

  async getAuditItems(auditLogId: string) {
    try {
      const { data, error } = await supabase
        .from('operation_audit_items')
        .select('*')
        .eq('audit_log_id', auditLogId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Fetch profiles separately to avoid foreign key ambiguity
      const profileIds = [...new Set(data?.map(item => item.assigned_to).filter(Boolean) || [])];
      
      if (profileIds.length === 0) {
        return data?.map(item => ({ ...item, profiles: undefined })) || [];
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', profileIds);

      const profilesMap: Record<string, any> = {};
      profiles?.forEach(p => profilesMap[p.id] = p);

      return data?.map(item => ({
        ...item,
        profiles: item.assigned_to ? profilesMap[item.assigned_to] : undefined
      } as OperationAuditItem)) || [];
    } catch (error) {
      logger.error('Error fetching audit items', error);
      return [];
    }
  }

  async createAuditItem(item: {
    audit_log_id: string;
    content: string;
    assigned_to?: string;
    order_index?: number;
  }) {
    try {
      const { data, error } = await supabase
        .from('operation_audit_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data as OperationAuditItem;
    } catch (error) {
      logger.error('Error creating audit item', error);
      throw error;
    }
  }

  async createBulkAuditItems(items: Array<{
    audit_log_id: string;
    content: string;
    assigned_to?: string;
    order_index: number;
  }>) {
    try {
      const { data, error } = await supabase
        .from('operation_audit_items')
        .insert(items)
        .select();

      if (error) throw error;
      return data as OperationAuditItem[];
    } catch (error) {
      logger.error('Error creating bulk audit items', error);
      throw error;
    }
  }

  async updateAuditItem(id: string, updates: Partial<OperationAuditItem>) {
    try {
      const { data, error } = await supabase
        .from('operation_audit_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating audit item', error);
      throw error;
    }
  }

  async deleteAuditItem(id: string) {
    try {
      const { error } = await supabase
        .from('operation_audit_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error deleting audit item', error);
      return false;
    }
  }

  async markItemComplete(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('operation_audit_items')
        .update({
          status: 'completed',
          completed_by: profile?.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error marking item complete', error);
      throw error;
    }
  }

  async createTaskFromItem(itemId: string, auditLogId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the item
      const { data: item, error: itemError } = await supabase
        .from('operation_audit_items')
        .select('*, operation_audit_logs!inner(*)')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      // Get user's profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Create task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: item.content,
          description: `Auto-created from Operations Audit Log: ${item.operation_audit_logs.title}`,
          assignee_id: item.assigned_to,
          created_by: user.id,
          due_at: item.operation_audit_logs.deadline,
          task_type: 'task',
          priority: 'Medium',
          status: 'Pending',
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Link task to item
      const { error: updateError } = await supabase
        .from('operation_audit_items')
        .update({ task_id: task.id })
        .eq('id', itemId);

      if (updateError) throw updateError;

      return task;
    } catch (error) {
      logger.error('Error creating task from item', error);
      throw error;
    }
  }

  async getDefaultAssignees(platform: string) {
    try {
      const { data, error } = await supabase
        .from('platform_team_mapping')
        .select('default_assignees')
        .eq('platform', platform);

      if (error) throw error;

      const allAssignees = data.flatMap(mapping => mapping.default_assignees || []);
      return [...new Set(allAssignees)];
    } catch (error) {
      logger.error('Error fetching default assignees', error);
      return [];
    }
  }

  async getAuditStats() {
    try {
      const { data: logs, error: logsError } = await supabase
        .from('operation_audit_logs')
        .select('id, status');

      const { data: items, error: itemsError } = await supabase
        .from('operation_audit_items')
        .select('status');

      if (logsError || itemsError) throw logsError || itemsError;

      return {
        totalLogs: logs?.length || 0,
        inProgress: logs?.filter(l => l.status === 'in_progress').length || 0,
        completed: logs?.filter(l => l.status === 'completed').length || 0,
        pendingItems: items?.filter(i => i.status === 'pending').length || 0,
        completedItems: items?.filter(i => i.status === 'completed').length || 0,
        failedItems: items?.filter(i => i.status === 'failed').length || 0,
      };
    } catch (error) {
      logger.error('Error fetching audit stats', error);
      return null;
    }
  }
}

export const operationsService = new OperationsService();
