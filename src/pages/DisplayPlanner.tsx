import { useState } from "react";
import { DisplayAdEditor } from "@/components/ads/DisplayAdEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SearchHierarchyPanel } from "@/components/search/SearchHierarchyPanel";

type ViewState = 'hierarchy' | 'ad-editor';

interface EditorContext {
  ad: any;
  adGroup: any;
  campaign: any;
  entity: string;
}

export default function DisplayPlanner() {
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
          title="Display Ads Planner"
          description="Create and manage display advertising campaigns"
        />
      </div>

      <div className="flex-1 overflow-hidden">
        {editorContext ? (
          <DisplayAdEditor
            ad={editorContext.ad}
            adGroup={editorContext.adGroup}
            campaign={editorContext.campaign}
            entity={editorContext.entity}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={40} minSize={30}>
              <SearchHierarchyPanel
                onEditAd={handleEditAd}
                onCreateAd={handleCreateAd}
                adType="display"
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={60} minSize={40}>
              <div className="h-full flex items-center justify-center p-8 bg-muted/30">
                <div className="text-center space-y-2">
                  <p className="text-body text-muted-foreground">
                    Select an ad from the hierarchy to edit
                  </p>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
