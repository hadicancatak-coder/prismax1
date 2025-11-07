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

      // Note: Ad approval now uses approval_history table with stages
      // This is legacy code for task approvals only
      if (entityType === 'task') {
        // For tasks, just update status
        // Task approval history uses a different system
      }

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

      // Note: Ad approval now uses approval_history table with stages
      // This is legacy code for task approvals only
      if (entityType === 'task') {
        // For tasks, just update status
        // Task approval history uses a different system
      }

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
