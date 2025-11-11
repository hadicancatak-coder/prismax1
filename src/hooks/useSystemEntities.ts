import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SystemEntity {
  id: string;
  name: string;
  code: string;
  emoji: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export const useSystemEntities = () => {
  return useQuery({
    queryKey: ['system-entities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_entities')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as SystemEntity[];
    }
  });
};

export const useAllEntities = () => {
  return useQuery({
    queryKey: ['all-entities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_entities')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as SystemEntity[];
    }
  });
};

export const useCreateEntity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entity: Omit<SystemEntity, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) => {
      const { data, error } = await supabase
        .from('system_entities')
        .insert(entity)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-entities'] });
      queryClient.invalidateQueries({ queryKey: ['all-entities'] });
      toast({ title: 'Entity created successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create entity', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });
};

export const useUpdateEntity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SystemEntity> & { id: string }) => {
      const { data, error } = await supabase
        .from('system_entities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-entities'] });
      queryClient.invalidateQueries({ queryKey: ['all-entities'] });
      toast({ title: 'Entity updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update entity', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });
};

export const useToggleEntity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('system_entities')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system-entities'] });
      queryClient.invalidateQueries({ queryKey: ['all-entities'] });
      toast({ 
        title: variables.is_active ? 'Entity activated' : 'Entity deactivated'
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update entity status', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });
};

export const useEntityChangeLog = (entityId?: string) => {
  return useQuery({
    queryKey: ['entity-change-log', entityId],
    queryFn: async () => {
      let query = supabase
        .from('entity_change_log')
        .select(`
          *,
          changed_by_profile:changed_by(name, email)
        `)
        .order('changed_at', { ascending: false })
        .limit(50);
      
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!entityId || entityId === undefined
  });
};
