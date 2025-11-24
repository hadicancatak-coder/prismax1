import { useState } from "react";
import SearchAdEditor from "@/components/search/SearchAdEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SearchHierarchyPanel } from "@/components/search/SearchHierarchyPanel";
import { AdPreviewPanel } from "@/components/search/AdPreviewPanel";
import { CampaignPreviewPanel } from "@/components/search/CampaignPreviewPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type ViewState = 'hierarchy' | 'ad-editor' | 'campaign-preview';

interface EditorContext {
  ad: any;
  adGroup: any;
  campaign: any;
  entity: string;
}

interface CampaignContext {
  campaign: any;
  entity: string;
}

interface SearchPlannerProps {
  adType?: "search" | "display";
}

export default function SearchPlanner({ adType = "search" }: SearchPlannerProps) {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(null);
  const [campaignContext, setCampaignContext] = useState<CampaignContext | null>(null);
  const [editorState, setEditorState] = useState<any>({
    headlines: [],
    descriptions: [],
    sitelinks: [],
    callouts: [],
    landingPage: '',
    businessName: '',
    language: 'EN',
    name: '',
    longHeadline: '',
    shortHeadlines: [],
    ctaText: ''
  });

  // Fetch ad groups and ads for campaign preview
  const { data: adGroups = [] } = useQuery({
    queryKey: ['ad-groups-for-campaign', campaignContext?.campaign?.id],
    queryFn: async () => {
      if (!campaignContext?.campaign?.id) return [];
      const { data } = await supabase
        .from('ad_groups')
        .select('*')
        .eq('campaign_id', campaignContext.campaign.id);
      return data || [];
    },
    enabled: !!campaignContext?.campaign?.id
  });

  const { data: campaignAds = [] } = useQuery({
    queryKey: ['ads-for-campaign', campaignContext?.campaign?.id, adType],
    queryFn: async () => {
      if (!campaignContext?.campaign?.id) return [];
      const adGroupIds = adGroups.map(ag => ag.id);
      if (adGroupIds.length === 0) return [];
      
      const { data } = await supabase
        .from('ads')
        .select('*')
        .in('ad_group_id', adGroupIds)
        .eq('ad_type', adType);
      return data || [];
    },
    enabled: !!campaignContext?.campaign?.id && adGroups.length > 0
  });

  const handleEditAd = (ad: any, adGroup: any, campaign: any, entity: string) => {
    console.log('handleEditAd called', { ad, adGroup, campaign, entity });
    setEditorContext({ ad, adGroup, campaign, entity });
    setCampaignContext(null);
  };

  const handleCreateAd = (adGroup: any, campaign: any, entity: string) => {
    console.log('handleCreateAd called', { adGroup, campaign, entity });
    // Create a new ad object with default values
    const newAd = {
      name: `New ${adType === 'search' ? 'Search' : 'Display'} Ad`,
      ad_group_id: adGroup.id,
      ad_group_name: adGroup.name,
      campaign_name: campaign.name,
      entity: entity,
      ad_type: adType,
      headlines: [],
      descriptions: [],
      sitelinks: [],
      callouts: [],
      landing_page: '',
      business_name: '',
      language: 'EN',
      long_headline: '',
      short_headlines: [],
      cta_text: '',
      approval_status: 'draft'
    };
    setEditorContext({ ad: newAd, adGroup, campaign, entity });
    setCampaignContext(null);
  };

  const handleCampaignClick = (campaign: any, entity: string) => {
    setCampaignContext({ campaign, entity });
    setEditorContext(null);
  };

  const handleSave = () => {
    setEditorContext(null);
  };

  const handleCancel = () => {
    setEditorContext(null);
    setCampaignContext(null);
  };

  const handleFieldChange = (fields: any) => {
    setEditorState(fields);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-border bg-background">
        <PageHeader
          title="Search Ads Planner"
          description="Create and manage search advertising campaigns"
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* LEFT: Hierarchy */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <SearchHierarchyPanel
              onEditAd={handleEditAd}
              onCreateAd={handleCreateAd}
              onCampaignClick={handleCampaignClick}
              adType={adType}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* RIGHT: Campaign Preview OR Ad Editor (with integrated preview) */}
          <ResizablePanel defaultSize={70} minSize={50} className="overflow-auto">
            {campaignContext ? (
              <CampaignPreviewPanel
                campaign={campaignContext.campaign}
                adGroups={adGroups}
                ads={campaignAds}
                entity={campaignContext.entity}
                onViewAllAds={() => setCampaignContext(null)}
                onEditAd={handleEditAd}
                onCreateAd={handleCreateAd}
                onCreateAdGroup={(campaign, entity) => {
                  // Optionally handle creating ad group inline
                }}
              />
            ) : editorContext ? (
              <SearchAdEditor
                ad={editorContext.ad}
                adGroup={editorContext.adGroup}
                campaign={editorContext.campaign}
                entity={editorContext.entity}
                adType={adType}
                onSave={handleSave}
                onCancel={handleCancel}
                showHeader={false}
                onFieldChange={handleFieldChange}
              />
            ) : (
              <div className="h-full flex items-center justify-center p-md bg-muted/30">
                <div className="text-center space-y-sm">
                  <p className="text-body text-muted-foreground">
                    Select a campaign to preview or an ad to edit
                  </p>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
