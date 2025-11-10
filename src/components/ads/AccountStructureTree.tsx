import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, ChevronDown, FolderOpen, Folder, FileText, Layers, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TreeNode {
  id: string;
  type: 'entity' | 'campaign' | 'adgroup' | 'ad';
  name: string;
  children?: TreeNode[];
  versionCount?: number;
  status?: string;
  parentId?: string;
}

interface AccountStructureTreeProps {
  selectedNodeId?: string;
  onSelectNode: (node: TreeNode) => void;
  onCreateCampaign?: (entityName: string) => void;
  onCreateAdGroup?: (campaignId: string, campaignName: string) => void;
  onCreateAd?: (adGroupId: string, adGroupName: string) => void;
}

export function AccountStructureTree({ 
  selectedNodeId, 
  onSelectNode,
  onCreateCampaign,
  onCreateAdGroup,
  onCreateAd 
}: AccountStructureTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Fetch entities from entity_presets
  const { data: entityPresets } = useQuery({
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

  // Fetch campaigns with entity info
  const { data: campaigns } = useQuery({
    queryKey: ['ad-campaigns-tree'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch ad groups
  const { data: adGroups } = useQuery({
    queryKey: ['ad-groups-tree'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_groups')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch ads with version counts
  const { data: ads } = useQuery({
    queryKey: ['ads-tree'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads')
        .select('id, name, ad_group_id, approval_status')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch ad version counts
  const { data: versionCounts } = useQuery({
    queryKey: ['ad-version-counts'],
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

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const buildTree = (): TreeNode[] => {
    if (!entityPresets || !campaigns) return [];

    const tree: TreeNode[] = [];

    entityPresets.forEach(preset => {
      preset.entities?.forEach((entityName: string) => {
        const entityNode: TreeNode = {
          id: `entity-${entityName}`,
          type: 'entity',
          name: entityName,
          children: []
        };

        // Find campaigns for this entity
        const entityCampaigns = campaigns.filter(c => c.entity === entityName);
        
        entityCampaigns.forEach(campaign => {
          const campaignNode: TreeNode = {
            id: `campaign-${campaign.id}`,
            type: 'campaign',
            name: campaign.name,
            status: campaign.status,
            parentId: entityNode.id,
            children: []
          };

          // Find ad groups for this campaign
          const campaignAdGroups = adGroups?.filter(ag => ag.campaign_id === campaign.id) || [];
          
          campaignAdGroups.forEach(adGroup => {
            const adGroupNode: TreeNode = {
              id: `adgroup-${adGroup.id}`,
              type: 'adgroup',
              name: adGroup.name,
              status: adGroup.status,
              parentId: campaignNode.id,
              children: []
            };

            // Find ads for this ad group
            const adGroupAds = ads?.filter(ad => ad.ad_group_id === adGroup.id) || [];
            
            adGroupAds.forEach(ad => {
              const adNode: TreeNode = {
                id: `ad-${ad.id}`,
                type: 'ad',
                name: ad.name,
                status: ad.approval_status || 'pending',
                versionCount: versionCounts?.[ad.id] || 0,
                parentId: adGroupNode.id
              };
              adGroupNode.children?.push(adNode);
            });

            if (adGroupNode.children && adGroupNode.children.length > 0) {
              campaignNode.children?.push(adGroupNode);
            }
          });

          if (campaignNode.children && campaignNode.children.length > 0) {
            entityNode.children?.push(campaignNode);
          }
        });

        if (entityNode.children && entityNode.children.length > 0) {
          tree.push(entityNode);
        }
      });
    });

    return tree;
  };

  const renderNode = (node: TreeNode, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodeId === node.id;

    const getIcon = () => {
      switch (node.type) {
        case 'entity':
          return <Layers className="h-4 w-4 text-primary" />;
        case 'campaign':
          return hasChildren && isExpanded ? <FolderOpen className="h-4 w-4 text-blue-500" /> : <Folder className="h-4 w-4 text-blue-500" />;
        case 'adgroup':
          return hasChildren && isExpanded ? <FolderOpen className="h-4 w-4 text-purple-500" /> : <Folder className="h-4 w-4 text-purple-500" />;
        case 'ad':
          return <FileText className="h-4 w-4 text-green-500" />;
        default:
          return null;
      }
    };

    const getStatusBadge = () => {
      if (!node.status) return null;
      
      const statusColors: Record<string, string> = {
        active: 'bg-green-500/10 text-green-700 border-green-500/20',
        draft: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
        paused: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
        pending: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
        approved: 'bg-green-500/10 text-green-700 border-green-500/20',
        rejected: 'bg-red-500/10 text-red-700 border-red-500/20'
      };

      return (
        <Badge variant="outline" className={cn("text-xs h-5", statusColors[node.status] || '')}>
          {node.status}
        </Badge>
      );
    };

    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-muted/50 transition-colors",
            isSelected && "bg-muted"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelectNode(node)}
          onMouseEnter={() => setHoveredNode(node.id)}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-0 hover:bg-muted rounded"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          {getIcon()}
          
          <span className="flex-1 text-sm truncate">{node.name}</span>
          
          {/* Quick Action Button - only on hover */}
          {hoveredNode === node.id && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                if (node.type === 'entity') onCreateCampaign?.(node.name);
                if (node.type === 'campaign') onCreateAdGroup?.(node.id.replace('campaign-', ''), node.name);
                if (node.type === 'adgroup') onCreateAd?.(node.id.replace('adgroup-', ''), node.name);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          
          {node.versionCount && node.versionCount > 0 && (
            <Badge variant="secondary" className="text-xs h-5 shrink-0">
              v{node.versionCount}
            </Badge>
          )}
          
          {getStatusBadge()}
          
          {hasChildren && (
            <Badge variant="outline" className="text-xs h-5 shrink-0">
              {node.children?.length}
            </Badge>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children?.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree();

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Account Structure</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {tree.length} entities
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {tree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No campaigns found. Create a campaign to get started.
            </div>
          ) : (
            tree.map(node => renderNode(node))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
