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
      console.log('🚀 Calling approve-item Edge Function:', { entityType, entityId });

      // Call Edge Function which handles admin validation and approval server-side
      const { data, error } = await supabase.functions.invoke('approve-item', {
        body: { entityType, entityId, comment, changes }
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(error.message || 'Failed to approve item');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Approval failed');
      }

      console.log('✅ Approval successful');
      return { success: true, message: data.message || 'Approved successfully' };
    } catch (error: any) {
      console.error('❌ Approval failed:', error);
      throw error;
    }
  }

  async rejectItem({ entityType, entityId, comment, changes = {} }: ApproveItemParams) {
    try {
      console.log('🚀 Calling reject-item Edge Function:', { entityType, entityId });

      // Call Edge Function which handles admin validation and rejection server-side
      const { data, error } = await supabase.functions.invoke('reject-item', {
        body: { entityType, entityId, comment }
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(error.message || 'Failed to reject item');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Rejection failed');
      }

      console.log('✅ Rejection successful');
      return { success: true, message: data.message || 'Rejected successfully' };
    } catch (error: any) {
      console.error('❌ Rejection failed:', error);
      throw error;
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
      try {
        const success = await this.approveItem(item);
        results.push({ ...item, success });
      } catch (error) {
        results.push({ ...item, success: false, error });
      }
    }

    return results;
  }

  async bulkReject(items: Array<{ entityType: EntityType; entityId: string; comment?: string }>) {
    const results = [];
    
    for (const item of items) {
      try {
        const success = await this.rejectItem(item);
        results.push({ ...item, success });
      } catch (error) {
        results.push({ ...item, success: false, error });
      }
    }

    return results;
  }
}

export const approvalService = new ApprovalService();
