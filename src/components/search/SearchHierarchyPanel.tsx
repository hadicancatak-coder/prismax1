import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Plus, Folder, FolderOpen, FileText } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CreateCampaignDialog } from "../ads/CreateCampaignDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ENTITIES } from "@/lib/constants";

interface SearchHierarchyPanelProps {
  onEditAd: (ad: any, adGroup: any, campaign: any, entity: string) => void;
  onCreateAd: (adGroup: any, campaign: any, entity: string) => void;
}

export function SearchHierarchyPanel({ onEditAd, onCreateAd }: SearchHierarchyPanelProps) {
  const queryClient = useQueryClient();
  const [selectedEntity, setSelectedEntity] = useState<string>("UAE");
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdGroups, setExpandedAdGroups] = useState<Set<string>>(new Set());
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateAdGroup, setShowCreateAdGroup] = useState<{campaignId: string; campaignName: string} | null>(null);

  // Fetch campaigns for selected entity
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns-hierarchy', selectedEntity],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('entity', selectedEntity)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedEntity
  });

  // Fetch all ad groups for efficiency
  const { data: adGroups = [] } = useQuery({
    queryKey: ['ad-groups-hierarchy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_groups')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch all ads for efficiency
  const { data: ads = [] } = useQuery({
    queryKey: ['ads-hierarchy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(campaignId)) {
        next.delete(campaignId);
      } else {
        next.add(campaignId);
      }
      return next;
    });
  };

  const toggleAdGroup = (adGroupId: string) => {
    setExpandedAdGroups(prev => {
      const next = new Set(prev);
      if (next.has(adGroupId)) {
        next.delete(adGroupId);
      } else {
        next.add(adGroupId);
      }
      return next;
    });
  };

  const handleCampaignCreated = () => {
    setShowCreateCampaign(false);
    queryClient.invalidateQueries({ queryKey: ['campaigns-hierarchy'] });
    queryClient.invalidateQueries({ queryKey: ['ad-campaigns-tree'] });
  };

  const handleAdGroupCreated = (adGroupId: string) => {
    setShowCreateAdGroup(null);
    queryClient.invalidateQueries({ queryKey: ['ad-groups-hierarchy'] });
    queryClient.invalidateQueries({ queryKey: ['ad-groups-tree'] });
  };

  const getAdGroupsForCampaign = (campaignId: string) => {
    return adGroups.filter(ag => ag.campaign_id === campaignId);
  };

  const getAdsForAdGroup = (adGroupId: string) => {
    return ads.filter(ad => ad.ad_group_id === adGroupId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b space-y-4">
        <div className="space-y-2">
          <Label>Select Entity</Label>
          <Select value={selectedEntity} onValueChange={setSelectedEntity}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTITIES.map(entity => (
                <SelectItem key={entity} value={entity}>{entity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowCreateCampaign(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No campaigns yet. Create one to get started.
            </div>
          ) : (
            campaigns.map(campaign => {
              const campaignAdGroups = getAdGroupsForCampaign(campaign.id);
              const isExpanded = expandedCampaigns.has(campaign.id);

              return (
                <Collapsible key={campaign.id} open={isExpanded} onOpenChange={() => toggleCampaign(campaign.id)}>
                  <div className="border-2 border-blue-200 rounded-lg mb-3 overflow-hidden">
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      {isExpanded ? <FolderOpen className="h-[18px] w-[18px] text-blue-600" /> : <Folder className="h-[18px] w-[18px] text-blue-600" />}
                      <span className="flex-1 font-semibold text-sm">{campaign.name}</span>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                        {campaignAdGroups.length} groups
                      </Badge>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCreateAdGroup({ campaignId: campaign.id, campaignName: campaign.name });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <CollapsibleContent>
                      <div className="pl-10 pr-3 pb-3 space-y-2 bg-white">
                        {campaignAdGroups.length === 0 ? (
                          <div className="text-xs text-muted-foreground py-2 px-2">
                            No ad groups yet
                          </div>
                        ) : (
                          campaignAdGroups.map(adGroup => {
                            const adGroupAds = getAdsForAdGroup(adGroup.id);
                            const isAdGroupExpanded = expandedAdGroups.has(adGroup.id);

                            return (
                              <Collapsible key={adGroup.id} open={isAdGroupExpanded} onOpenChange={() => toggleAdGroup(adGroup.id)}>
                                <div className="rounded-md bg-purple-50/30">
                                  <div className="flex items-center gap-3 p-2.5 hover:bg-purple-50/60 transition-colors">
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        {isAdGroupExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                      </Button>
                                    </CollapsibleTrigger>
                                    {isAdGroupExpanded ? <FolderOpen className="h-4 w-4 text-purple-600" /> : <Folder className="h-4 w-4 text-purple-600" />}
                                    <span className="flex-1 text-sm font-medium">{adGroup.name}</span>
                                    <Badge variant="outline" className="text-xs border-purple-300 bg-purple-50/50">
                                      {adGroupAds.length} ads
                                    </Badge>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onCreateAd(adGroup, campaign, selectedEntity);
                                      }}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <CollapsibleContent>
                                    <div className="pl-9 pr-2 pb-2 space-y-1">
                                      {adGroupAds.length === 0 ? (
                                        <div className="text-xs text-muted-foreground py-2 px-2">
                                          No ads yet
                                        </div>
                                      ) : (
                                        adGroupAds.map(ad => (
                                          <div 
                                            key={ad.id} 
                                            className="flex items-center gap-3 p-2 hover:bg-green-50/50 rounded-md cursor-pointer transition-colors"
                                            onClick={() => {
                                              onEditAd(ad, adGroup, campaign, selectedEntity);
                                            }}
                                          >
                                            <FileText className="h-4 w-4 text-green-600" />
                                            <span className="flex-1 text-sm">{ad.name}</span>
                                            {ad.approval_status && (
                                              <Badge variant="outline" className="text-xs h-5 border-green-300">
                                                {ad.approval_status}
                                              </Badge>
                                            )}
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            );
                          })
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={showCreateCampaign}
        onOpenChange={setShowCreateCampaign}
        defaultEntity={selectedEntity}
        onSuccess={handleCampaignCreated}
      />

      {/* Create Ad Group Dialog */}
      {showCreateAdGroup && (
        <CreateAdGroupDialog
          open={!!showCreateAdGroup}
          onOpenChange={(open) => !open && setShowCreateAdGroup(null)}
          campaignId={showCreateAdGroup.campaignId}
          campaignName={showCreateAdGroup.campaignName}
          onSuccess={handleAdGroupCreated}
        />
      )}
    </div>
  );
}

// Simple Ad Group Creation Dialog
function CreateAdGroupDialog({ 
  open, 
  onOpenChange, 
  campaignId, 
  campaignName, 
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  campaignId: string; 
  campaignName: string; 
  onSuccess: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter an ad group name");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ad_groups")
        .insert({
          name: name.trim(),
          campaign_id: campaignId,
          status: "active"
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Ad group created successfully");
      setName("");
      onSuccess(data.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to create ad group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Ad Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            Campaign: <span className="font-medium">{campaignName}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adgroup-name">Ad Group Name *</Label>
            <Input
              id="adgroup-name"
              placeholder="e.g., Exact Match Keywords"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate} disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Create Ad Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
