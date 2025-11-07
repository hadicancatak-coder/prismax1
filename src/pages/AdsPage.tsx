import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Download, TestTube, Folder } from "lucide-react";
import AdEditorPanel from "@/components/ads/AdEditorPanel";
import AdListPanel from "@/components/ads/AdListPanel";
import BulkActionsToolbar from "@/components/ads/BulkActionsToolbar";
import { BulkImportDialog } from "@/components/ads/BulkImportDialog";
import { BulkCSVImportDialog } from "@/components/ads/BulkCSVImportDialog";
import { BulkCSVExportDialog } from "@/components/ads/BulkCSVExportDialog";
import { SavedElementsLibrary } from "@/components/ads/SavedElementsLibrary";
import { ApprovalWorkflowDialog } from "@/components/ads/ApprovalWorkflowDialog";
import { UpdateGoogleStatusDialog } from "@/components/ads/UpdateGoogleStatusDialog";
import { CampaignGroupingFilters } from "@/components/ads/CampaignGroupingFilters";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { insertSampleAds } from "@/lib/adSampleData";
import { useAdKeyboardShortcuts } from "@/hooks/useAdKeyboardShortcuts";

export default function AdsPage() {
  const [activeTab, setActiveTab] = useState("search");
  const [selectedAdForEdit, setSelectedAdForEdit] = useState<any | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showCSVImportDialog, setShowCSVImportDialog] = useState(false);
  const [showCSVExportDialog, setShowCSVExportDialog] = useState(false);
  const [showElementsLibrary, setShowElementsLibrary] = useState(false);
  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
  const [showGoogleStatusDialog, setShowGoogleStatusDialog] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState("");
  const [adGroupFilter, setAdGroupFilter] = useState("");

  const { data: ads = [], isLoading, refetch } = useQuery({
    queryKey: ["ads", campaignFilter, adGroupFilter, activeTab],
    queryFn: async () => {
      let query = supabase.from("ads").select("*");

      if (activeTab === "search") {
        query = query.or("ad_type.eq.search,ad_type.is.null");
      } else if (activeTab === "display") {
        query = query.eq("ad_type", "display");
      }

      if (campaignFilter) {
        query = query.eq("campaign_name", campaignFilter);
      }
      if (adGroupFilter) {
        query = query.eq("ad_group_name", adGroupFilter);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const campaigns = Array.from(new Set(ads.map((ad) => ad.campaign_name).filter(Boolean)));
  const adGroups = Array.from(new Set(ads.map((ad) => ad.ad_group_name).filter(Boolean)));

  const handleSaveAd = async (adData: any) => {
    if (selectedAdForEdit?.id) {
      // Update existing ad
      const { error } = await supabase
        .from("ads")
        .update(adData)
        .eq("id", selectedAdForEdit.id);

      if (error) throw error;
    } else {
      // Create new ad
      const { error } = await supabase.from("ads").insert(adData);
      if (error) throw error;
    }

    refetch();
    setSelectedAdForEdit(null);
    setIsCreatingNew(false);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (
    action: "approve" | "reject" | "export" | "delete",
    ids: string[]
  ) => {
    switch (action) {
      case "approve":
        await supabase.from("ads").update({ approval_status: "approved" }).in("id", ids);
        toast.success(`${ids.length} ads approved`);
        break;
      case "reject":
        await supabase.from("ads").update({ approval_status: "rejected" }).in("id", ids);
        toast.success(`${ids.length} ads rejected`);
        break;
      case "export":
        setShowCSVExportDialog(true);
        break;
      case "delete":
        await supabase.from("ads").delete().in("id", ids);
        toast.success(`${ids.length} ads deleted`);
        setSelectedIds([]);
        break;
    }
    refetch();
  };

  const handleDuplicate = async () => {
    if (selectedIds.length === 0) return;

    const adsToDuplicate = ads?.filter((ad) => selectedIds.includes(ad.id));

    for (const ad of adsToDuplicate || []) {
      const { id, created_at, updated_at, ...adData } = ad;
      await supabase.from("ads").insert({
        ...adData,
        name: `${adData.name} (Copy)`,
      });
    }

    toast.success(`${selectedIds.length} ads duplicated`);
    setSelectedIds([]);
    refetch();
  };

  const handleSampleAds = async () => {
    try {
      await insertSampleAds();
      toast.success("Sample ads added successfully!");
      refetch();
    } catch (error) {
      console.error("Error inserting sample ads:", error);
      toast.error("Failed to add sample ads");
    }
  };

  // Keyboard shortcuts
  useAdKeyboardShortcuts({
    onSave: () => {
      if (selectedAdForEdit || isCreatingNew) {
        document.querySelector<HTMLButtonElement>('[type="button"]')?.click();
      }
    },
    onNew: () => {
      setIsCreatingNew(true);
      setSelectedAdForEdit(null);
    },
    onCancel: () => {
      setSelectedAdForEdit(null);
      setIsCreatingNew(false);
    },
    onNext: () => {
      if (ads && selectedAdForEdit) {
        const currentIndex = ads.findIndex((ad) => ad.id === selectedAdForEdit.id);
        if (currentIndex < ads.length - 1) {
          setSelectedAdForEdit(ads[currentIndex + 1]);
        }
      }
    },
    onPrevious: () => {
      if (ads && selectedAdForEdit) {
        const currentIndex = ads.findIndex((ad) => ad.id === selectedAdForEdit.id);
        if (currentIndex > 0) {
          setSelectedAdForEdit(ads[currentIndex - 1]);
        }
      }
    },
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Google Ads Planner</CardTitle>
              <CardDescription>
                Mass campaign preparation with split-screen workflow
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setIsCreatingNew(true);
                  setSelectedAdForEdit(null);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Ad
              </Button>
              <Button variant="outline" onClick={() => setShowCSVImportDialog(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" onClick={() => setShowCSVExportDialog(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
          <Button variant="outline" onClick={() => setShowElementsLibrary(true)}>
            <Folder className="mr-2 h-4 w-4" />
            Elements Library
          </Button>
              <Button variant="outline" onClick={handleSampleAds}>
                <TestTube className="mr-2 h-4 w-4" />
                Add Sample Ads
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <CampaignGroupingFilters
            campaignName={campaignFilter}
            onCampaignNameChange={setCampaignFilter}
            adGroupName={adGroupFilter}
            onAdGroupNameChange={setAdGroupFilter}
            campaigns={campaigns}
            adGroups={adGroups}
          />

          <div className="mb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="search">Search Ads</TabsTrigger>
                <TabsTrigger value="display">Display Ads</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Split-Screen Layout */}
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[calc(100vh-280px)] rounded-lg border"
          >
            {/* Left Panel - Ad List */}
            <ResizablePanel defaultSize={40} minSize={30} maxSize={50}>
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

            {/* Right Panel - Ad Editor */}
            <ResizablePanel defaultSize={60} minSize={50}>
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
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="text-muted-foreground">
                      <p className="text-lg font-medium mb-2">Select an ad to edit</p>
                      <p className="text-sm">or click "+ Create New Ad" to create one</p>
                    </div>
                    {ads && ads.length === 0 && (
                      <div className="pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreatingNew(true);
                            setSelectedAdForEdit(null);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Ad
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>

          {/* Bulk Actions Toolbar */}
          <BulkActionsToolbar
            selectedCount={selectedIds.length}
            onClearSelection={() => setSelectedIds([])}
            onExport={() => handleBulkAction("export", selectedIds)}
            onDuplicate={handleDuplicate}
            onDelete={() => handleBulkAction("delete", selectedIds)}
            onApprove={() => handleBulkAction("approve", selectedIds)}
            onReject={() => handleBulkAction("reject", selectedIds)}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={showElementsLibrary} onOpenChange={setShowElementsLibrary}>
        <DialogContent className="max-w-7xl max-h-[90vh]">
          <SavedElementsLibrary />
        </DialogContent>
      </Dialog>

      <BulkCSVImportDialog
        open={showCSVImportDialog}
        onOpenChange={setShowCSVImportDialog}
        onImportComplete={refetch}
      />

      <BulkCSVExportDialog
        open={showCSVExportDialog}
        onOpenChange={setShowCSVExportDialog}
        ads={selectedIds.length > 0 ? ads.filter((ad) => selectedIds.includes(ad.id)) : ads}
      />
    </div>
  );
}
