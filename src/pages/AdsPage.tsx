import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Download, Database, LayoutGrid, LayoutDashboard, Columns, Maximize } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdEditorPanel from "@/components/ads/AdEditorPanel";
import AdListPanel from "@/components/ads/AdListPanel";
import { AccountStructureTree } from "@/components/ads/AccountStructureTree";
import { CreateCampaignDialog } from "@/components/ads/CreateCampaignDialog";
import { CreateAdGroupDialog } from "@/components/ads/CreateAdGroupDialog";
import { SavedElementsLibrary } from "@/components/ads/SavedElementsLibrary";
import BulkActionsToolbar from "@/components/ads/BulkActionsToolbar";
import { BulkCSVImportDialog } from "@/components/ads/BulkCSVImportDialog";
import { BulkCSVExportDialog } from "@/components/ads/BulkCSVExportDialog";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TreeNode } from "@/hooks/useAccountStructure";
import { SAMPLE_ADS } from "@/lib/adSampleData";

export default function AdsPage() {
  const [activeTab, setActiveTab] = useState("search");
  const [selectedAdForEdit, setSelectedAdForEdit] = useState<any | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCSVImportDialog, setShowCSVImportDialog] = useState(false);
  const [showCSVExportDialog, setShowCSVExportDialog] = useState(false);
  const [showElementsLibrary, setShowElementsLibrary] = useState(false);
  const [selectedTreeNode, setSelectedTreeNode] = useState<TreeNode | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [layoutMode, setLayoutMode] = useState<'tree-list-editor' | 'list-editor' | 'editor-only'>('tree-list-editor');
  const [createCampaignDialog, setCreateCampaignDialog] = useState<{open: boolean, entityName: string} | null>(null);
  const [createAdGroupDialog, setCreateAdGroupDialog] = useState<{open: boolean, campaignId: string, campaignName: string} | null>(null);
  
  const queryClient = useQueryClient();

  const { data: entities } = useQuery({
    queryKey: ['entity-presets-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entity_presets')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: ads = [], isLoading, refetch } = useQuery({
    queryKey: ["ads", activeTab, entityFilter, statusFilter],
    queryFn: async () => {
      let query = supabase.from("ads").select("*");

      if (activeTab === "search") {
        query = query.or("ad_type.eq.search,ad_type.is.null");
      } else if (activeTab === "display") {
        query = query.eq("ad_type", "display");
      }

      if (entityFilter !== 'all') {
        query = query.eq('entity', entityFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('approval_status', statusFilter);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSaveAd = async (adData: any) => {
    if (selectedAdForEdit?.id) {
      // Update existing ad
      const { error } = await supabase.from("ads").update(adData).eq("id", selectedAdForEdit.id);
      if (error) {
        toast.error("Failed to update ad");
        return;
      }
      toast.success("Ad updated successfully");
    } else {
      // Create new ad
      const { error } = await supabase.from("ads").insert(adData);
      if (error) {
        toast.error("Failed to create ad");
        return;
      }
      toast.success("Ad created successfully");
    }
    refetch();
    setIsCreatingNew(false);
    setSelectedAdForEdit(null);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selId) => selId !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string, ids: string[]) => {
    if (action === "delete") {
      const { error } = await supabase.from("ads").delete().in("id", ids);
      if (error) {
        toast.error("Failed to delete ads");
        return;
      }
      toast.success(`Deleted ${ids.length} ads`);
      setSelectedIds([]);
      refetch();
    }
  };

  const handleDuplicate = async (ids: string[]) => {
    const adsToDuplicate = ads.filter((ad: any) => ids.includes(ad.id));
    const duplicates = adsToDuplicate.map((ad: any) => {
      const { id, created_at, updated_at, ...rest } = ad;
      return { ...rest, name: `${ad.name} (Copy)` };
    });
    const { error } = await supabase.from("ads").insert(duplicates);
    if (error) {
      toast.error("Failed to duplicate ads");
      return;
    }
    toast.success(`Duplicated ${ids.length} ads`);
    setSelectedIds([]);
    refetch();
  };

  const handleSampleAds = async () => {
    const { error } = await supabase.from("ads").insert(SAMPLE_ADS);
    if (error) {
      toast.error("Failed to add sample ads");
      return;
    }
    toast.success("Sample ads added successfully");
    refetch();
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-8rem)]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Google Ads Planner
              <Badge variant="outline" className="ml-2">
                {ads.length} {ads.length === 1 ? "Ad" : "Ads"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Create, manage, and optimize your Google Ads campaigns with hierarchical structure
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entities?.flatMap(preset => 
                  preset.entities.map((ent: string) => (
                    <SelectItem key={ent} value={ent}>{ent}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Layout
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setLayoutMode('tree-list-editor')}>
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Tree + List + Editor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLayoutMode('list-editor')}>
                  <Columns className="h-4 w-4 mr-2" />
                  List + Editor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLayoutMode('editor-only')}>
                  <Maximize className="h-4 w-4 mr-2" />
                  Editor Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={() => { setSelectedAdForEdit(null); setIsCreatingNew(true); }} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Ad
            </Button>
            <Button onClick={() => setShowCSVImportDialog(true)} variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setShowCSVExportDialog(true)} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={showElementsLibrary} onOpenChange={setShowElementsLibrary}>
              <Button variant="outline" size="sm" onClick={() => setShowElementsLibrary(true)}>
                <Database className="w-4 h-4 mr-2" />
                Elements Library
              </Button>
              <DialogContent className="max-w-[95vw] h-[90vh]">
                <SavedElementsLibrary />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="search">Search Ads</TabsTrigger>
            <TabsTrigger value="display">Display Ads</TabsTrigger>
          </TabsList>
        </Tabs>

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Conditional: Left Panel - Account Structure Tree */}
          {layoutMode === 'tree-list-editor' && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <AccountStructureTree
                  selectedNodeId={selectedTreeNode?.id}
                  onSelectNode={(node) => {
                    setSelectedTreeNode(node);
                    if (node.type === 'ad') {
                      const ad = ads?.find(a => a.id === node.id.replace('ad-', ''));
                      if (ad) {
                        setSelectedAdForEdit(ad);
                        setIsCreatingNew(false);
                      }
                    }
                  }}
                  onCreateCampaign={(entityName) => setCreateCampaignDialog({open: true, entityName})}
                  onCreateAdGroup={(campaignId, campaignName) => setCreateAdGroupDialog({open: true, campaignId, campaignName})}
                  onCreateAd={(adGroupId, adGroupName) => {
                    setSelectedAdForEdit({ ad_group_id: adGroupId, ad_group_name: adGroupName });
                    setIsCreatingNew(true);
                  }}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Conditional: Middle Panel - Ad List */}
          {(layoutMode === 'tree-list-editor' || layoutMode === 'list-editor') && (
            <>
              <ResizablePanel defaultSize={layoutMode === 'tree-list-editor' ? 30 : 40} minSize={25}>
                <AdListPanel
                  ads={ads || []}
                  selectedAdId={selectedAdForEdit?.id || null}
                  onSelectAd={(ad) => {
                    setSelectedAdForEdit(ad);
                    setIsCreatingNew(false);
                  }}
                  selectedIds={selectedIds}
                  onToggleSelection={toggleSelection}
                  onBulkAction={handleBulkAction}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Right Panel - Ad Editor (Always visible) */}
          <ResizablePanel 
            defaultSize={
              layoutMode === 'tree-list-editor' ? 50 :
              layoutMode === 'list-editor' ? 60 : 100
            } 
            minSize={40}
          >
            {selectedAdForEdit || isCreatingNew ? (
              <AdEditorPanel
                ad={selectedAdForEdit}
                onSave={handleSaveAd}
                onCancel={() => {
                  setSelectedAdForEdit(null);
                  setIsCreatingNew(false);
                }}
                isCreating={isCreatingNew}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <p>Select an ad to edit or create a new one</p>
                  <Button onClick={() => setIsCreatingNew(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Ad
                  </Button>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>

        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onExport={() => handleBulkAction("export", selectedIds)}
          onDuplicate={() => handleDuplicate(selectedIds)}
          onDelete={() => handleBulkAction("delete", selectedIds)}
        />
      </CardContent>

      <BulkCSVImportDialog open={showCSVImportDialog} onOpenChange={setShowCSVImportDialog} />
      <BulkCSVExportDialog
        open={showCSVExportDialog}
        onOpenChange={setShowCSVExportDialog}
        ads={selectedIds.map(id => ads?.find(a => a.id === id)).filter(Boolean) as any[]}
      />

      {/* Campaign Creation Dialog */}
      {createCampaignDialog && (
        <CreateCampaignDialog
          open={createCampaignDialog.open}
          onOpenChange={(open) => !open && setCreateCampaignDialog(null)}
          entityName={createCampaignDialog.entityName}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['ad-campaigns-structure'] });
            setCreateCampaignDialog(null);
          }}
        />
      )}

      {/* Ad Group Creation Dialog */}
      {createAdGroupDialog && (
        <CreateAdGroupDialog
          open={createAdGroupDialog.open}
          onOpenChange={(open) => !open && setCreateAdGroupDialog(null)}
          campaignId={createAdGroupDialog.campaignId}
          campaignName={createAdGroupDialog.campaignName}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['ad-groups-structure'] });
            setCreateAdGroupDialog(null);
          }}
        />
      )}
    </Card>
  );
}
