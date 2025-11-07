import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles, Upload, Download, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SavedAdDialog } from "@/components/SavedAdDialog";
import { SavedElementsLibrary } from "@/components/ads/SavedElementsLibrary";
import { BulkCSVImportDialog } from "@/components/ads/BulkCSVImportDialog";
import { BulkCSVExportDialog } from "@/components/ads/BulkCSVExportDialog";
import { ApprovalWorkflowDialog } from "@/components/ads/ApprovalWorkflowDialog";
import { CampaignGroupingFilters } from "@/components/ads/CampaignGroupingFilters";
import { CardSkeleton } from "@/components/skeletons/CardSkeleton";

export default function AdsPage() {
  const [selectedTab, setSelectedTab] = useState('search');
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [showSavedAdDialog, setShowSavedAdDialog] = useState(false);
  const [showElementsLibrary, setShowElementsLibrary] = useState(false);
  const [adToEdit, setAdToEdit] = useState<any>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [adGroupFilter, setAdGroupFilter] = useState('all');

  const { data: ads = [], isLoading, refetch } = useQuery({
    queryKey: ['ads', campaignFilter, adGroupFilter],
    queryFn: async () => {
      let query = supabase.from('ads').select('*');
      
      if (campaignFilter && campaignFilter !== 'all') {
        query = query.eq('campaign_name', campaignFilter);
      }
      if (adGroupFilter && adGroupFilter !== 'all') {
        query = query.eq('ad_group_name', adGroupFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Get unique campaigns and ad groups for filters
  const allAds = ads || [];
  const campaigns = Array.from(new Set(allAds.map(ad => ad.campaign_name).filter(Boolean))) as string[];
  const adGroups = Array.from(new Set(allAds.map(ad => ad.ad_group_name).filter(Boolean))) as string[];

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
          <Button onClick={() => setShowSavedAdDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Ad
          </Button>
          <Button variant="outline" onClick={() => setShowElementsLibrary(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Saved Elements Library
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

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="search">Search Ads</TabsTrigger>
          <TabsTrigger value="display">Display Ads</TabsTrigger>
          <TabsTrigger value="social">Social Ads</TabsTrigger>
        </TabsList>

        {/* Search Ads Tab */}
        <TabsContent value="search" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : ads.filter(ad => ad.ad_type === 'search' || !ad.ad_type).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No search ads yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first search ad or import from CSV</p>
                <Button onClick={() => setShowSavedAdDialog(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Search Ad
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ads.filter(ad => ad.ad_type === 'search' || !ad.ad_type).map((ad) => (
                <Card key={ad.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{ad.name}</CardTitle>
                    <CardDescription>
                      {ad.campaign_name && <div className="text-xs">Campaign: {ad.campaign_name}</div>}
                      {ad.ad_group_name && <div className="text-xs">Ad Group: {ad.ad_group_name}</div>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Entity:</span>
                      <span>{ad.entity || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        ad.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                        ad.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ad.approval_status || 'pending'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAd(ad)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAd(ad);
                          setShowApprovalWorkflow(true);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approval
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Display Ads Tab */}
        <TabsContent value="display">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Display ads coming soon
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Ads Tab */}
        <TabsContent value="social">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Social ads coming soon
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SavedAdDialog
        open={showSavedAdDialog}
        onOpenChange={(open) => {
          setShowSavedAdDialog(open);
          if (!open) {
            setAdToEdit(null);
            refetch();
          }
        }}
        ad={adToEdit}
        onUpdate={refetch}
      />

      {showElementsLibrary && <SavedElementsLibrary />}

      <BulkCSVImportDialog
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        onImportComplete={() => refetch()}
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
