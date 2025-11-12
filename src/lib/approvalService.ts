import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";

type EntityType = 'task' | 'ad' | 'campaign' | 'launch_campaign';
type ApprovalStatus = 'approved' | 'rejected';

interface ApproveItemParams {
  entityType: EntityType;
  entityId: string;
  comment?: string;
  changes?: Record<string, any>;
}

interface ApprovalFilters {
  entityType?: EntityType;
  status?: ApprovalStatus;
  requesterId?: string;
  approverId?: string;
  startDate?: Date;
  endDate?: Date;
}

class ApprovalService {
  async approveItem({ entityType, entityId, comment, changes = {} }: ApproveItemParams) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (entityType === 'task') {
      // Get the change request
      const { data: changeRequest, error: fetchError } = await supabase
        .from('task_change_requests')
        .select('*, payload_json')
        .eq('id', entityId)
        .eq('status', 'pending')
        .single();
      
      if (fetchError) throw new Error(`Failed to fetch change request: ${fetchError.message}`);
      if (!changeRequest) throw new Error('Change request not found or already processed');

      // Apply the changes to the task
      const payload = changeRequest.payload_json as any;
      
      if (changeRequest.type === 'status_change') {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ 
            status: payload.status,
            failure_reason: payload.failure_reason 
          })
          .eq('id', payload.task_id);
        
        if (updateError) throw new Error(`Failed to update task: ${updateError.message}`);
      }

      // Mark request as approved
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error: approveError } = await supabase
        .from('task_change_requests')
        .update({ 
          status: 'approved',
          decided_by: profile.id,
          decided_at: new Date().toISOString()
        })
        .eq('id', entityId);
      
      if (approveError) throw new Error(`Failed to approve request: ${approveError.message}`);
    }

    if (entityType === 'ad') {
      const { error } = await supabase
        .from('ads')
        .update({ approval_status: 'approved' })
        .eq('id', entityId);
      if (error) throw new Error(`Failed to approve ad: ${error.message}`);
    }

    return { success: true, message: 'Approved successfully' };
  }

  async rejectItem({ entityType, entityId, comment, changes = {} }: ApproveItemParams) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (entityType === 'task') {
      // Get the change request
      const { data: changeRequest, error: fetchError } = await supabase
        .from('task_change_requests')
        .select('*')
        .eq('id', entityId)
        .eq('status', 'pending')
        .single();
      
      if (fetchError) throw new Error(`Failed to fetch change request: ${fetchError.message}`);
      if (!changeRequest) throw new Error('Change request not found or already processed');

      // Mark request as rejected (don't apply changes)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error: rejectError } = await supabase
        .from('task_change_requests')
        .update({ 
          status: 'rejected',
          decided_by: profile.id,
          decided_at: new Date().toISOString()
        })
        .eq('id', entityId);
      
      if (rejectError) throw new Error(`Failed to reject request: ${rejectError.message}`);
    }

    if (entityType === 'ad') {
      const { error } = await supabase
        .from('ads')
        .update({ approval_status: 'rejected' })
        .eq('id', entityId);
      if (error) throw new Error(`Failed to reject ad: ${error.message}`);
    }

    return { success: true, message: 'Rejected successfully' };
  }

  async getApprovalHistory(filters: ApprovalFilters = {}) {
    try {
      // Note: This returns ads approval history only
      // The new approval_history table is ad-specific with stages
      const { data, error } = await supabase
        .from('approval_history')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (err) {
      logger.error('Error fetching approval history', err);
      return [];
    }
  }

  async bulkApprove(items: Array<{ entityType: EntityType; entityId: string; comment?: string }>) {
    const results = [];
    
    for (const item of items) {
      const success = await this.approveItem(item);
      results.push({ ...item, success });
    }

    return results;
  }

  async bulkReject(items: Array<{ entityType: EntityType; entityId: string; comment?: string }>) {
    const results = [];
    
    for (const item of items) {
      const success = await this.rejectItem(item);
      results.push({ ...item, success });
    }

    return results;
  }
}

export const approvalService = new ApprovalService();
