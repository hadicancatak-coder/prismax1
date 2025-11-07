import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ApprovalHistoryEntry {
  id: string;
  ad_id: string;
  stage: 'copywriter' | 'team_lead' | 'legal' | 'final';
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  approver_id?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export function useApprovalHistory(adId: string) {
  return useQuery({
    queryKey: ['approval-history', adId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approval_history')
        .select('*')
        .eq('ad_id', adId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ApprovalHistoryEntry[];
    },
    enabled: !!adId,
  });
}

export function useAddApprovalEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entry: Omit<ApprovalHistoryEntry, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('approval_history')
        .insert(entry)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-history'] });
      toast({ title: 'Approval entry added' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to add approval entry', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}
