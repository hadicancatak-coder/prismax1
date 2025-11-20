import { useState } from "react";
import SearchAdEditor from "@/components/search/SearchAdEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdPlannerLayout } from "@/components/search/AdPlannerLayout";
import { AdStructureTab } from "@/components/search/AdStructureTab";
import { AdEditorTab } from "@/components/search/AdEditorTab";
import { AdToolsTab } from "@/components/search/AdToolsTab";
import { AdLibraryTab } from "@/components/search/AdLibraryTab";
import { AdBatchTab } from "@/components/search/AdBatchTab";
import { AdPreviewPanel } from "@/components/search/AdPreviewPanel";
import { AdQuickActions } from "@/components/search/AdQuickActions";

type ViewState = 'hierarchy' | 'ad-editor';

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
    setEditorContext({ ad: {}, adGroup, campaign, entity });
  };

  const handleSave = () => {
    setEditorContext(null);
  };

  const handleCancel = () => {
    setEditorContext(null);
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
        {editorContext ? (
          <SearchAdEditor
            ad={editorContext.ad}
            adGroup={editorContext.adGroup}
            campaign={editorContext.campaign}
            entity={editorContext.entity}
            adType={adType}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <AdPlannerLayout
            structureTab={
              <AdStructureTab
                adType={adType}
                onEditAd={handleEditAd}
                onCreateAd={handleCreateAd}
              />
            }
            editorTab={<AdEditorTab onSave={handleSave} onCancel={handleCancel} />}
            toolsTab={<AdToolsTab />}
            libraryTab={<AdLibraryTab />}
            batchTab={<AdBatchTab />}
            previewPanel={<AdPreviewPanel />}
          />
        )}
      </div>

      <AdQuickActions />
    </div>
  );
}
