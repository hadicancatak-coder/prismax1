import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Upload, Download, CheckCircle2, LayoutGrid, Table as TableIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SavedAdDialog } from "@/components/SavedAdDialog";
import { CreateAdDialog } from "@/components/ads/CreateAdDialog";
import { SavedElementsLibrary } from "@/components/ads/SavedElementsLibrary";
import { BulkCSVImportDialog } from "@/components/ads/BulkCSVImportDialog";
import { BulkCSVExportDialog } from "@/components/ads/BulkCSVExportDialog";
import { ApprovalWorkflowDialog } from "@/components/ads/ApprovalWorkflowDialog";
import { CampaignGroupingFilters } from "@/components/ads/CampaignGroupingFilters";
import { DisplayAdPreview } from "@/components/ads/DisplayAdPreview";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SavedAdsTableView } from "@/components/ads/SavedAdsTableView";

export default function AdsPage() {
  const [activeTab, setActiveTab] = useState("search");
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showElementsLibrary, setShowElementsLibrary] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [adGroupFilter, setAdGroupFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const { data: ads = [], isLoading, refetch } = useQuery({
    queryKey: ['ads', campaignFilter, adGroupFilter, activeTab],
    queryFn: async () => {
      let query = supabase.from('ads').select('*');
      
      // Filter by ad type based on active tab
      if (activeTab === 'search') {
        query = query.or('ad_type.eq.search,ad_type.is.null');
      } else if (activeTab === 'display') {
        query = query.eq('ad_type', 'display');
      }
      
      if (campaignFilter && campaignFilter !== 'all') {
        query = query.eq('campaign_name', campaignFilter);
      }
      if (adGroupFilter && adGroupFilter !== 'all') {
        query = query.eq('ad_group_name', adGroupFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const campaigns = Array.from(new Set(ads.map(ad => ad.campaign_name).filter(Boolean)));
  const adGroups = Array.from(new Set(ads.map(ad => ad.ad_group_name).filter(Boolean)));

  return (
    <div className="px-4 md:px-8 lg:px-48 py-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8" />
            Google Ads Planner
          </h1>
          <p className="text-muted-foreground mt-1">Mass campaign preparation with version control and approval workflow</p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Ad
          </Button>
          <Button variant="outline" onClick={() => setShowElementsLibrary(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Elements Library
          </Button>
          <Button variant="outline" onClick={() => setShowBulkImport(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={() => setShowBulkExport(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Campaign & Ad Group Filters */}
      <CampaignGroupingFilters
        campaignName={campaignFilter}
        onCampaignNameChange={setCampaignFilter}
        adGroupName={adGroupFilter}
        onAdGroupNameChange={setAdGroupFilter}
        campaigns={campaigns}
        adGroups={adGroups}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="search">Search Ads</TabsTrigger>
          <TabsTrigger value="display">Display Ads</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">Loading ads...</div>
          ) : ads.length === 0 ? (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No search ads yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first search ad or import from Google Ads Editor
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Search Ad
              </Button>
            </Card>
          ) : viewMode === 'table' ? (
            <SavedAdsTableView
              ads={ads}
              onViewAd={(ad) => {
                setSelectedAd(ad);
                setShowAdDialog(true);
              }}
              onEditAd={(ad) => {
                setSelectedAd(ad);
                setShowAdDialog(true);
              }}
              onDeleteAd={async (adId) => {
                await supabase.from('ads').delete().eq('id', adId);
                refetch();
              }}
              onRefresh={() => refetch()}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ads.map((ad) => (
                <Card
                  key={ad.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedAd(ad);
                    setShowAdDialog(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{ad.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {ad.entity} • {ad.campaign_name || 'No campaign'} • {ad.ad_group_name || 'No ad group'}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        ad.approval_status === 'approved' ? 'default' :
                        ad.approval_status === 'rejected' ? 'destructive' :
                        ad.approval_status === 'changes_requested' ? 'secondary' :
                        'outline'
                      }
                      className="ml-2 shrink-0"
                    >
                      {ad.approval_status || 'draft'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(ad.created_at).toLocaleDateString()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="display" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">Loading ads...</div>
          ) : ads.length === 0 ? (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No display ads yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first display ad with rich media content
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Display Ad
              </Button>
            </Card>
          ) : viewMode === 'table' ? (
            <SavedAdsTableView
              ads={ads}
              onViewAd={(ad) => {
                setSelectedAd(ad);
                setShowAdDialog(true);
              }}
              onEditAd={(ad) => {
                setSelectedAd(ad);
                setShowAdDialog(true);
              }}
              onDeleteAd={async (adId) => {
                await supabase.from('ads').delete().eq('id', adId);
                refetch();
              }}
              onRefresh={() => refetch()}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ads.map((ad) => (
                <Card
                  key={ad.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedAd(ad);
                    setShowAdDialog(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{ad.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {ad.entity} • {ad.campaign_name || 'No campaign'} • {ad.ad_group_name || 'No ad group'}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        ad.approval_status === 'approved' ? 'default' :
                        ad.approval_status === 'rejected' ? 'destructive' :
                        ad.approval_status === 'changes_requested' ? 'secondary' :
                        'outline'
                      }
                      className="ml-2 shrink-0"
                    >
                      {ad.approval_status || 'draft'}
                    </Badge>
                  </div>
                  
                  {/* Display Ad Preview */}
                  <div className="mt-3 border rounded p-2 bg-muted/30">
                    <DisplayAdPreview
                      businessName={ad.business_name || ''}
                      longHeadline={ad.long_headline || ''}
                      descriptions={ad.descriptions ? (typeof ad.descriptions === 'string' ? JSON.parse(ad.descriptions) : ad.descriptions) : []}
                      ctaText={ad.cta_text || ''}
                      landingPage={ad.landing_page || ''}
                    />
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(ad.created_at).toLocaleDateString()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateAdDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onComplete={refetch}
      />

      <SavedAdDialog
        open={showAdDialog}
        onOpenChange={(open) => {
          setShowAdDialog(open);
          if (!open) setSelectedAd(null);
        }}
        ad={selectedAd}
        onUpdate={refetch}
      />

      <Dialog open={showElementsLibrary} onOpenChange={setShowElementsLibrary}>
        <DialogContent className="max-w-7xl max-h-[90vh]">
          <SavedElementsLibrary />
        </DialogContent>
      </Dialog>

      <BulkCSVImportDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        onImportComplete={refetch}
      />

      <BulkCSVExportDialog
        open={showBulkExport}
        onOpenChange={setShowBulkExport}
        ads={ads}
      />

      <ApprovalWorkflowDialog
        open={showApprovalWorkflow}
        onOpenChange={setShowApprovalWorkflow}
        ad={selectedAd}
      />
    </div>
  );
}
