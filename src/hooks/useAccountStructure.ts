import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TreeNode {
  id: string;
  type: 'entity' | 'campaign' | 'adgroup' | 'ad';
  name: string;
  children?: TreeNode[];
  versionCount?: number;
  status?: string;
  parentId?: string;
}

export function useAccountStructure() {
  const entities = useQuery({
    queryKey: ['entity-presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entity_presets')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const campaigns = useQuery({
    queryKey: ['ad-campaigns-structure'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const adGroups = useQuery({
    queryKey: ['ad-groups-structure'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_groups')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const ads = useQuery({
    queryKey: ['ads-structure'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads')
        .select('id, name, ad_group_id, approval_status')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const versionCounts = useQuery({
    queryKey: ['version-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_versions')
        .select('ad_id');
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(v => {
        counts[v.ad_id] = (counts[v.ad_id] || 0) + 1;
      });
      return counts;
    }
  });

  return {
    entities,
    campaigns,
    adGroups,
    ads,
    versionCounts,
    isLoading: entities.isLoading || campaigns.isLoading || adGroups.isLoading || ads.isLoading
  };
}
