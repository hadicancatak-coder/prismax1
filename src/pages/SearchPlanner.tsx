import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Save } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { AccountStructureTree } from "@/components/ads/AccountStructureTree";
import { SavedAdsManager } from "@/components/ads/SavedAdsManager";
import AdListPanel from "@/components/ads/AdListPanel";
import AdEditorPanel from "@/components/ads/AdEditorPanel";
import { CreateCampaignDialog } from "@/components/ads/CreateCampaignDialog";
import { CreateAdGroupDialog } from "@/components/ads/CreateAdGroupDialog";
import { MoveAdDialog } from "@/components/ads/MoveAdDialog";
import { DuplicateAdDialog } from "@/components/ads/DuplicateAdDialog";
import { BulkCSVImportDialog } from "@/components/ads/BulkCSVImportDialog";
import { BulkCSVExportDialog } from "@/components/ads/BulkCSVExportDialog";
import BulkActionsToolbar from "@/components/ads/BulkActionsToolbar";
import { TreeNode } from "@/hooks/useAccountStructure";
import { usePanelCollapse } from "@/hooks/usePanelCollapse";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SearchPlanner() {
  const [selectedAdForEdit, setSelectedAdForEdit] = useState<any | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTreeNode, setSelectedTreeNode] = useState<TreeNode | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createCampaignDialog, setCreateCampaignDialog] = useState<{open: boolean, entityName: string} | null>(null);
  const [createAdGroupDialog, setCreateAdGroupDialog] = useState<{open: boolean, campaignId: string, campaignName: string} | null>(null);
  const [moveDialogState, setMoveDialogState] = useState<{open: boolean, ids: string[]} | null>(null);
  const [duplicateDialogState, setDuplicateDialogState] = useState<{open: boolean, ids: string[]} | null>(null);
  const [showCSVImportDialog, setShowCSVImportDialog] = useState(false);
  const [showCSVExportDialog, setShowCSVExportDialog] = useState(false);

  const { collapsed, togglePanel } = usePanelCollapse();
  const queryClient = useQueryClient();

  useKeyboardShortcuts([
    { key: 'n', ctrl: true, callback: () => { setSelectedAdForEdit(null); setIsCreatingNew(true); } },
    { key: 'd', ctrl: true, callback: () => selectedIds.length > 0 && setDuplicateDialogState({ open: true, ids: selectedIds }) },
  ]);

  const { data: entities } = useQuery({
    queryKey: ['entity-presets-filter'],
    queryFn: async () => {
      const { data, error } = await supabase.from('entity_presets').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: ads = [], isLoading, refetch } = useQuery({
    queryKey: ["ads-search", entityFilter, statusFilter],
    queryFn: async () => {
      let query = supabase.from("ads").select("*").or("ad_type.eq.search,ad_type.is.null");

      if (entityFilter !== 'all') query = query.eq('entity', entityFilter);
      if (statusFilter !== 'all') query = query.eq('approval_status', statusFilter);

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSaveAd = async (adData: any) => {
    if (selectedAdForEdit?.id) {
      const { error } = await supabase.from("ads").update(adData).eq("id", selectedAdForEdit.id);
      if (error) {
        toast.error("Failed to update ad");
        return;
      }
      toast.success("Ad updated successfully");
    } else {
      const { error } = await supabase.from("ads").insert({ ...adData, ad_type: 'search' });
      if (error) {
        toast.error("Failed to create ad");
        return;
      }
      toast.success("Ad created successfully");
    }
    await refetch();
    queryClient.invalidateQueries({ queryKey: ["ads"] });
    setSelectedAdForEdit(null);
    setIsCreatingNew(false);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = async (action: string) => {
    if (action === 'delete' && selectedIds.length > 0) {
      const { error } = await supabase.from("ads").delete().in("id", selectedIds);
      if (error) {
        toast.error("Failed to delete ads");
        return;
      }
      toast.success(`Deleted ${selectedIds.length} ads`);
      setSelectedIds([]);
      await refetch();
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Planner</h1>
          <p className="text-muted-foreground">Build and manage Search ad campaigns</p>
        </div>
        
        <Tabs value="search" className="w-auto">
          <TabsList>
            <TabsTrigger value="search" asChild>
              <Link to="/ads/search">Search</Link>
            </TabsTrigger>
            <TabsTrigger value="display" asChild>
              <Link to="/ads/display">Display</Link>
            </TabsTrigger>
            <TabsTrigger value="library" asChild>
              <Link to="/ads/library">Library</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entities?.map(entity => (
                    <SelectItem key={entity.id} value={entity.name}>{entity.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => { setSelectedAdForEdit(null); setIsCreatingNew(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                New Ad
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ResizablePanelGroup direction="horizontal" className="min-h-[700px]">
            <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
              <div className="h-full flex flex-col gap-4 pr-4">
                <AccountStructureTree
                  selectedNodeId={selectedTreeNode?.id}
                  onSelectNode={setSelectedTreeNode}
                  onCreateCampaign={(entityName) => setCreateCampaignDialog({ open: true, entityName })}
                  onCreateAdGroup={(campaignId, campaignName) => setCreateAdGroupDialog({ open: true, campaignId, campaignName })}
                  onCreateAd={(adGroupId, adGroupName) => {
                    setSelectedAdForEdit({ ad_group_id: adGroupId });
                    setIsCreatingNew(true);
                  }}
                />
                <SavedAdsManager onSelectAd={(ad) => setSelectedAdForEdit(ad)} />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="h-full px-4">
                <AdListPanel
                  ads={ads}
                  selectedAdId={selectedAdForEdit?.id || null}
                  onSelectAd={(ad) => { setSelectedAdForEdit(ad); setIsCreatingNew(false); }}
                  selectedIds={selectedIds}
                  onToggleSelection={toggleSelection}
                  onBulkAction={async (action, ids) => {
                    if (action === 'delete') await handleBulkAction('delete');
                  }}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={35} minSize={25}>
              <div className="h-full pl-4">
                <AdEditorPanel
                  ad={selectedAdForEdit}
                  isCreating={isCreatingNew}
                  onSave={handleSaveAd}
                  onCancel={() => { setSelectedAdForEdit(null); setIsCreatingNew(false); }}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </CardContent>
      </Card>

      {selectedIds.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onDuplicate={() => setDuplicateDialogState({ open: true, ids: selectedIds })}
          onDelete={() => handleBulkAction('delete')}
          onExport={() => setShowCSVExportDialog(true)}
        />
      )}

      {createCampaignDialog && (
        <CreateCampaignDialog
          open={createCampaignDialog.open}
          onOpenChange={(open) => !open && setCreateCampaignDialog(null)}
          entityName={createCampaignDialog.entityName}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["ad_campaigns"] })}
        />
      )}

      {createAdGroupDialog && (
        <CreateAdGroupDialog
          open={createAdGroupDialog.open}
          onOpenChange={(open) => !open && setCreateAdGroupDialog(null)}
          campaignId={createAdGroupDialog.campaignId}
          campaignName={createAdGroupDialog.campaignName}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["ad_groups"] })}
        />
      )}

      {moveDialogState && moveDialogState.ids.length === 1 && (
        <MoveAdDialog
          open={moveDialogState.open}
          onOpenChange={(open) => !open && setMoveDialogState(null)}
          adId={moveDialogState.ids[0]}
          onSuccess={() => {
            refetch();
            setMoveDialogState(null);
            setSelectedIds([]);
          }}
        />
      )}

      {duplicateDialogState && duplicateDialogState.ids.length === 1 && (
        <DuplicateAdDialog
          open={duplicateDialogState.open}
          onOpenChange={(open) => !open && setDuplicateDialogState(null)}
          adId={duplicateDialogState.ids[0]}
          onSuccess={() => {
            refetch();
            setDuplicateDialogState(null);
            setSelectedIds([]);
          }}
        />
      )}

      {showCSVImportDialog && (
        <BulkCSVImportDialog
          open={showCSVImportDialog}
          onOpenChange={setShowCSVImportDialog}
        />
      )}

      {showCSVExportDialog && (
        <BulkCSVExportDialog
          open={showCSVExportDialog}
          onOpenChange={setShowCSVExportDialog}
          ads={ads}
        />
      )}
    </div>
  );
}
