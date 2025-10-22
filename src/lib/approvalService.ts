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
      // Fetch approval history and manually join profiles using user_id
      const { data: historyData, error: historyError } = await supabase
        .from('approval_history')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (historyError) throw historyError;
      
      // Manually join profiles by fetching all at once
      const userIds = [...new Set(historyData.flatMap(h => [h.requester_id, h.approver_id].filter(Boolean)))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const data = historyData.map(h => ({
        ...h,
        requester: h.requester_id ? profileMap.get(h.requester_id) : null,
        approver: h.approver_id ? profileMap.get(h.approver_id) : null,
      }));
      
      let query = data;

      // Apply filters
      if (filters.entityType) query = query.filter(h => h.entity_type === filters.entityType);
      if (filters.status) query = query.filter(h => h.status === filters.status);
      if (filters.requesterId) query = query.filter(h => h.requester_id === filters.requesterId);
      if (filters.approverId) query = query.filter(h => h.approver_id === filters.approverId);
      if (filters.startDate) query = query.filter(h => new Date(h.created_at) >= filters.startDate);
      if (filters.endDate) query = query.filter(h => new Date(h.created_at) <= filters.endDate);

      return query;
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
