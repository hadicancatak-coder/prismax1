import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Plus, Folder, FolderOpen, FileText, Trash2, Copy } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CreateCampaignDialog } from "../ads/CreateCampaignDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ENTITIES } from "@/lib/constants";
import { DeleteAdDialog } from "./DeleteAdDialog";
import { DeleteAdGroupDialog } from "./DeleteAdGroupDialog";
import { DeleteCampaignDialog } from "./DeleteCampaignDialog";
import { DuplicateAdDialog } from "./DuplicateAdDialog";
import { DuplicateAdGroupDialog } from "./DuplicateAdGroupDialog";
import { DuplicateCampaignDialog } from "./DuplicateCampaignDialog";

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
  
  // Delete dialogs
  const [deleteAdDialog, setDeleteAdDialog] = useState<{ad: any} | null>(null);
  const [deleteAdGroupDialog, setDeleteAdGroupDialog] = useState<{adGroup: any; adsCount: number} | null>(null);
  const [deleteCampaignDialog, setDeleteCampaignDialog] = useState<{campaign: any; adGroupsCount: number; adsCount: number} | null>(null);
  
  // Duplicate dialogs
  const [duplicateAdDialog, setDuplicateAdDialog] = useState<{ad: any} | null>(null);
  const [duplicateAdGroupDialog, setDuplicateAdGroupDialog] = useState<{adGroup: any; adsCount: number} | null>(null);
  const [duplicateCampaignDialog, setDuplicateCampaignDialog] = useState<{campaign: any; adGroupsCount: number; adsCount: number} | null>(null);

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

  const handleDeleteSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['campaigns-hierarchy'] });
    queryClient.invalidateQueries({ queryKey: ['ad-groups-hierarchy'] });
    queryClient.invalidateQueries({ queryKey: ['ads-hierarchy'] });
  };

  const handleDuplicateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['campaigns-hierarchy'] });
    queryClient.invalidateQueries({ queryKey: ['ad-groups-hierarchy'] });
    queryClient.invalidateQueries({ queryKey: ['ads-hierarchy'] });
  };

  const getAdGroupsForCampaign = (campaignId: string) => {
    return adGroups.filter(ag => ag.campaign_id === campaignId);
  };

  const getAdsForAdGroup = (adGroupId: string) => {
    return ads.filter(ad => ad.ad_group_id === adGroupId);
  };

  const getTotalAdsForCampaign = (campaignId: string) => {
    const campaignAdGroups = getAdGroupsForCampaign(campaignId);
    return ads.filter(ad => campaignAdGroups.some(ag => ag.id === ad.ad_group_id)).length;
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
                  <div className="mb-3">
                    <div className="flex items-center gap-3 p-2 pl-2 hover:bg-blue-50/30 rounded-md transition-colors border-l-2 border-blue-400">
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
                          setDuplicateCampaignDialog({ 
                            campaign, 
                            adGroupsCount: campaignAdGroups.length, 
                            adsCount: getTotalAdsForCampaign(campaign.id) 
                          });
                        }}
                        title="Duplicate campaign"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCampaignDialog({ 
                            campaign, 
                            adGroupsCount: campaignAdGroups.length, 
                            adsCount: getTotalAdsForCampaign(campaign.id) 
                          });
                        }}
                        title="Delete campaign"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCreateAdGroup({ campaignId: campaign.id, campaignName: campaign.name });
                        }}
                        title="Create ad group"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <CollapsibleContent>
                      <div className="space-y-1.5 ml-6">
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
                                <div className="ml-6">
                                  <div className="flex items-center gap-3 p-2 hover:bg-purple-50/30 rounded-md transition-colors border-l-2 border-purple-400">
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
                                        setDuplicateAdGroupDialog({ adGroup, adsCount: adGroupAds.length });
                                      }}
                                      title="Duplicate ad group"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteAdGroupDialog({ adGroup, adsCount: adGroupAds.length });
                                      }}
                                      title="Delete ad group"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onCreateAd(adGroup, campaign, selectedEntity);
                                      }}
                                      title="Create ad"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <CollapsibleContent>
                                    <div className="space-y-1 ml-6">
                                      {adGroupAds.length === 0 ? (
                                        <div className="text-xs text-muted-foreground py-2 px-2">
                                          No ads yet
                                        </div>
                                      ) : (
                                        adGroupAds.map(ad => (
                                          <div 
                                            key={ad.id} 
                                            className="flex items-center gap-3 p-2 hover:bg-muted/30 rounded-md cursor-pointer transition-colors ml-6"
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

      {/* Delete Dialogs */}
      {deleteAdDialog && (
        <DeleteAdDialog
          open={!!deleteAdDialog}
          onOpenChange={(open) => !open && setDeleteAdDialog(null)}
          ad={deleteAdDialog.ad}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {deleteAdGroupDialog && (
        <DeleteAdGroupDialog
          open={!!deleteAdGroupDialog}
          onOpenChange={(open) => !open && setDeleteAdGroupDialog(null)}
          adGroup={deleteAdGroupDialog.adGroup}
          adsCount={deleteAdGroupDialog.adsCount}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {deleteCampaignDialog && (
        <DeleteCampaignDialog
          open={!!deleteCampaignDialog}
          onOpenChange={(open) => !open && setDeleteCampaignDialog(null)}
          campaign={deleteCampaignDialog.campaign}
          adGroupsCount={deleteCampaignDialog.adGroupsCount}
          adsCount={deleteCampaignDialog.adsCount}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {/* Duplicate Dialogs */}
      {duplicateAdDialog && (
        <DuplicateAdDialog
          open={!!duplicateAdDialog}
          onOpenChange={(open) => !open && setDuplicateAdDialog(null)}
          ad={duplicateAdDialog.ad}
          onSuccess={handleDuplicateSuccess}
        />
      )}

      {duplicateAdGroupDialog && (
        <DuplicateAdGroupDialog
          open={!!duplicateAdGroupDialog}
          onOpenChange={(open) => !open && setDuplicateAdGroupDialog(null)}
          adGroup={duplicateAdGroupDialog.adGroup}
          adsCount={duplicateAdGroupDialog.adsCount}
          onSuccess={handleDuplicateSuccess}
        />
      )}

      {duplicateCampaignDialog && (
        <DuplicateCampaignDialog
          open={!!duplicateCampaignDialog}
          onOpenChange={(open) => !open && setDuplicateCampaignDialog(null)}
          campaign={duplicateCampaignDialog.campaign}
          adGroupsCount={duplicateCampaignDialog.adGroupsCount}
          adsCount={duplicateCampaignDialog.adsCount}
          onSuccess={handleDuplicateSuccess}
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
