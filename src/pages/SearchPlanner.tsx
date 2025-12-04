import { useState } from "react";
import SearchAdEditor from "@/components/search/SearchAdEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SearchHierarchyPanel } from "@/components/search/SearchHierarchyPanel";
import { CampaignPreviewPanel } from "@/components/search/CampaignPreviewPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

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
    setEditorContext({ ad, adGroup, campaign, entity });
    setCampaignContext(null);
  };

  const handleCreateAd = (adGroup: any, campaign: any, entity: string) => {
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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-card/50">
        <PageHeader
          icon={Search}
          title="Search Ads Planner"
          description="Create and manage search advertising campaigns"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* LEFT: Hierarchy */}
          <ResizablePanel defaultSize={28} minSize={22} className="bg-card/30">
            <SearchHierarchyPanel
              onEditAd={handleEditAd}
              onCreateAd={handleCreateAd}
              onCampaignClick={handleCampaignClick}
              adType={adType}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-border hover:bg-primary/20 transition-colors" />
          
          {/* RIGHT: Campaign Preview OR Ad Editor */}
          <ResizablePanel defaultSize={72} minSize={50} className="overflow-auto bg-background">
            {campaignContext ? (
              <CampaignPreviewPanel
                campaign={campaignContext.campaign}
                adGroups={adGroups}
                ads={campaignAds}
                entity={campaignContext.entity}
                onViewAllAds={() => setCampaignContext(null)}
                onEditAd={handleEditAd}
                onCreateAd={handleCreateAd}
                onCreateAdGroup={(campaign, entity) => {}}
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
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto">
                    <Search className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-[18px] font-medium text-foreground">No selection</h3>
                    <p className="text-[14px] text-muted-foreground max-w-sm">
                      Select a campaign to preview or an ad to edit from the hierarchy panel
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
