import { useState } from "react";
import SearchAdEditor from "@/components/search/SearchAdEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SearchPlannerStructurePanel } from "@/components/search-planner";
import { Search, FileText } from "lucide-react";

interface EditorContext {
  ad: any;
  adGroup: any;
  campaign: any;
  entity: string;
}

interface SearchPlannerProps {
  adType?: "search" | "display";
}

export default function SearchPlanner({ adType = "search" }: SearchPlannerProps) {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(null);

  const handleEditAd = (ad: any, adGroup: any, campaign: any, entity: string) => {
    setEditorContext({ ad, adGroup, campaign, entity });
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
      approval_status: 'draft'
    };
    setEditorContext({ ad: newAd, adGroup, campaign, entity });
  };

  const handleCampaignClick = (campaign: any, entity: string) => {
    setEditorContext(null);
  };

  const handleSave = () => {
    setEditorContext(null);
  };

  const handleCancel = () => {
    setEditorContext(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Header */}
      <div className="px-lg py-md border-b border-border bg-card/50">
        <PageHeader
          icon={Search}
          title="Search Ads Planner"
          description="Create and manage search advertising campaigns"
        />
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* LEFT: Structure Panel */}
          <ResizablePanel defaultSize={25} minSize={18} maxSize={35} className="bg-card">
            <SearchPlannerStructurePanel
              onEditAd={handleEditAd}
              onCreateAd={handleCreateAd}
              onCampaignClick={handleCampaignClick}
              adType={adType}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-border hover:bg-primary/20 transition-smooth" />
          
          {/* RIGHT: Ad Editor (has built-in preview/quality panels) */}
          <ResizablePanel defaultSize={75} minSize={50} className="overflow-hidden bg-background">
            {editorContext ? (
              <SearchAdEditor
                ad={editorContext.ad}
                adGroup={editorContext.adGroup}
                campaign={editorContext.campaign}
                entity={editorContext.entity}
                adType={adType}
                onSave={handleSave}
                onCancel={handleCancel}
                showHeader={false}
              />
            ) : (
              <div className="h-full flex items-center justify-center p-lg">
                <div className="text-center space-y-md">
                  <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto">
                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-xs">
                    <h3 className="text-heading-sm font-medium text-foreground">Select an Ad to Edit</h3>
                    <p className="text-body-sm text-muted-foreground max-w-sm">
                      Choose an ad from the structure panel on the left, or create a new one within an ad group
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
