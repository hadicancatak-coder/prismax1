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
import SearchAdEditor from "./SearchAdEditor";
import { ENTITIES } from "@/lib/constants";

interface SearchHierarchyPanelProps {
  onAdCreated?: (adId: string) => void;
}

export function SearchHierarchyPanel({ onAdCreated }: SearchHierarchyPanelProps) {
  const queryClient = useQueryClient();
  const [selectedEntity, setSelectedEntity] = useState<string>("UAE");
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdGroups, setExpandedAdGroups] = useState<Set<string>>(new Set());
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateAdGroup, setShowCreateAdGroup] = useState<{campaignId: string; campaignName: string} | null>(null);
  const [showCreateAd, setShowCreateAd] = useState<{adGroupId: string; adGroupName: string; campaignId: string; campaign: any; entity: string} | null>(null);

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

  const handleAdCreatedInternal = (adId?: string) => {
    setShowCreateAd(null);
    queryClient.invalidateQueries({ queryKey: ['ads-hierarchy'] });
    queryClient.invalidateQueries({ queryKey: ['ads-tree'] });
    if (adId && onAdCreated) {
      onAdCreated(adId);
    }
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
                  <div className="border rounded-lg">
                    <div className="flex items-center gap-2 p-3 hover:bg-muted/50">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      {isExpanded ? <FolderOpen className="h-4 w-4 text-blue-500" /> : <Folder className="h-4 w-4 text-blue-500" />}
                      <span className="flex-1 font-medium text-sm">{campaign.name}</span>
                      <Badge variant="outline" className="text-xs">{campaignAdGroups.length} groups</Badge>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCreateAdGroup({ campaignId: campaign.id, campaignName: campaign.name });
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <CollapsibleContent>
                      <div className="pl-8 pr-3 pb-3 space-y-2">
                        {campaignAdGroups.length === 0 ? (
                          <div className="text-xs text-muted-foreground py-2">
                            No ad groups yet
                          </div>
                        ) : (
                          campaignAdGroups.map(adGroup => {
                            const adGroupAds = getAdsForAdGroup(adGroup.id);
                            const isAdGroupExpanded = expandedAdGroups.has(adGroup.id);

                            return (
                              <Collapsible key={adGroup.id} open={isAdGroupExpanded} onOpenChange={() => toggleAdGroup(adGroup.id)}>
                                <div className="border rounded-lg">
                                  <div className="flex items-center gap-2 p-2 hover:bg-muted/50">
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                                        {isAdGroupExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                      </Button>
                                    </CollapsibleTrigger>
                                    {isAdGroupExpanded ? <FolderOpen className="h-3.5 w-3.5 text-purple-500" /> : <Folder className="h-3.5 w-3.5 text-purple-500" />}
                                    <span className="flex-1 text-sm">{adGroup.name}</span>
                                    <Badge variant="outline" className="text-xs">{adGroupAds.length} ads</Badge>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-5 w-5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCreateAd({ 
                                          adGroupId: adGroup.id, 
                                          adGroupName: adGroup.name,
                                          campaignId: campaign.id,
                                          campaign,
                                          entity: selectedEntity
                                        });
                                      }}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  <CollapsibleContent>
                                    <div className="pl-6 pr-2 pb-2 space-y-1">
                                      {adGroupAds.length === 0 ? (
                                        <div className="text-xs text-muted-foreground py-2">
                                          No ads yet
                                        </div>
                                      ) : (
                                        adGroupAds.map(ad => (
                                          <div 
                                            key={ad.id} 
                                            className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                                            onClick={() => {
                                              setShowCreateAd({ 
                                                adGroupId: adGroup.id, 
                                                adGroupName: adGroup.name,
                                                campaignId: campaign.id,
                                                campaign,
                                                entity: selectedEntity
                                              });
                                            }}
                                          >
                                            <FileText className="h-3.5 w-3.5 text-green-500" />
                                            <span className="flex-1 text-xs">{ad.name}</span>
                                            {ad.approval_status && (
                                              <Badge variant="outline" className="text-xs h-4">
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
        entityName={selectedEntity}
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

      {/* Create/Edit Ad Dialog */}
      {showCreateAd && (
        <Dialog open={!!showCreateAd} onOpenChange={(open) => !open && setShowCreateAd(null)}>
          <DialogContent className="max-w-7xl h-[90vh] p-0">
            <SearchAdEditor
              ad={{}}
              adGroup={{ id: showCreateAd.adGroupId, name: showCreateAd.adGroupName }}
              campaign={showCreateAd.campaign}
              entity={showCreateAd.entity}
              onSave={handleAdCreatedInternal}
              onCancel={() => setShowCreateAd(null)}
            />
          </DialogContent>
        </Dialog>
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
