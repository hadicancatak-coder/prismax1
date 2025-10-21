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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get requester from change request if it's a task
      let requesterId: string | undefined;
      if (entityType === 'task') {
        const { data: changeRequest } = await supabase
          .from('task_change_requests')
          .select('requester_id')
          .eq('task_id', entityId)
          .eq('status', 'pending')
          .single();
        
        requesterId = changeRequest?.requester_id;
      }

      // Log approval history
      const { error: historyError } = await supabase
        .from('approval_history')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          requester_id: requesterId,
          approver_id: user.id,
          status: 'approved',
          changes,
          comment,
        });

      if (historyError) throw historyError;

      // Handle entity-specific approval logic
      if (entityType === 'ad') {
        const { error } = await supabase
          .from('ads')
          .update({ approval_status: 'approved' })
          .eq('id', entityId);
        if (error) throw error;
      }

      return true;
    } catch (err) {
      logger.error('Error approving item', err);
      return false;
    }
  }

  async rejectItem({ entityType, entityId, comment, changes = {} }: ApproveItemParams) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get requester from change request if it's a task
      let requesterId: string | undefined;
      if (entityType === 'task') {
        const { data: changeRequest } = await supabase
          .from('task_change_requests')
          .select('requester_id')
          .eq('task_id', entityId)
          .eq('status', 'pending')
          .single();
        
        requesterId = changeRequest?.requester_id;
      }

      // Log approval history
      const { error: historyError } = await supabase
        .from('approval_history')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          requester_id: requesterId,
          approver_id: user.id,
          status: 'rejected',
          changes,
          comment,
        });

      if (historyError) throw historyError;

      // Handle entity-specific rejection logic
      if (entityType === 'ad') {
        const { error } = await supabase
          .from('ads')
          .update({ approval_status: 'rejected' })
          .eq('id', entityId);
        if (error) throw error;
      }

      return true;
    } catch (err) {
      logger.error('Error rejecting item', err);
      return false;
    }
  }

  async getApprovalHistory(filters: ApprovalFilters = {}) {
    try {
      let query = supabase
        .from('approval_history')
        .select(`
          *,
          requester:profiles!approval_history_requester_id_fkey(name, email, avatar_url),
          approver:profiles!approval_history_approver_id_fkey(name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (filters.entityType) query = query.eq('entity_type', filters.entityType);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.requesterId) query = query.eq('requester_id', filters.requesterId);
      if (filters.approverId) query = query.eq('approver_id', filters.approverId);
      if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
      if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());

      const { data, error } = await query;
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
