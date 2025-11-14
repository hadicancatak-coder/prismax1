import { supabase } from "@/integrations/supabase/client";

export interface StatusLog {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  title: string;
  description?: string;
  log_type: 'issue' | 'blocker' | 'plan' | 'update' | 'note' | 'brief';
  entity?: string[];
  platform?: string;
  campaign_name?: string;
  status: 'active' | 'resolved' | 'archived';
  resolved_at?: string;
  resolved_by?: string;
  task_id?: string;
  converted_at?: string;
  converted_by?: string;
  socialua_update?: string;
  ppc_update?: string;
  profiles?: {
    name: string;
    email: string;
  };
}

export interface StatusLogFilters {
  entity?: string[];
  platform?: string;
  campaign_name?: string;
  status?: string;
  log_type?: string;
  search?: string;
}

class StatusLogService {
  async getStatusLogs(filters?: StatusLogFilters) {
    let query = supabase
      .from('status_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.entity && filters.entity.length > 0) {
      query = query.overlaps('entity', filters.entity);
    }

    if (filters?.platform) {
      query = query.eq('platform', filters.platform);
    }

    if (filters?.campaign_name) {
      query = query.eq('campaign_name', filters.campaign_name);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.log_type) {
      query = query.eq('log_type', filters.log_type);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as StatusLog[];
  }

  async createStatusLog(log: Omit<StatusLog, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'profiles'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('status_logs')
      .insert({
        ...log,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStatusLog(id: string, updates: Partial<StatusLog>) {
    const { data, error } = await supabase
      .from('status_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteStatusLog(id: string) {
    const { error } = await supabase
      .from('status_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async resolveStatusLog(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('status_logs')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async convertToTask(logId: string, taskData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        created_by: user.id,
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Update the log with task reference
    const { data, error } = await supabase
      .from('status_logs')
      .update({
        task_id: task.id,
        converted_at: new Date().toISOString(),
        converted_by: user.id,
      })
      .eq('id', logId)
      .select()
      .single();

    if (error) throw error;
    return { log: data, task };
  }

  async getStatusLogStats() {
    const { data, error } = await supabase
      .from('status_logs')
      .select('status, log_type');

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(log => log.status === 'active').length,
      resolved: data.filter(log => log.status === 'resolved').length,
      issues: data.filter(log => log.log_type === 'issue' && log.status === 'active').length,
      blockers: data.filter(log => log.log_type === 'blocker' && log.status === 'active').length,
    };

    return stats;
  }
}

export const statusLogService = new StatusLogService();
