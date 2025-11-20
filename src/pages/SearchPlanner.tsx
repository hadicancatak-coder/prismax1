import { useState, useEffect } from "react";
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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SearchHierarchyPanel } from "@/components/search/SearchHierarchyPanel";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Layout } from "lucide-react";

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
  const [useNewLayout, setUseNewLayout] = useState(() => {
    const saved = localStorage.getItem('ad-planner-layout');
    return saved === 'new';
  });

  useEffect(() => {
    localStorage.setItem('ad-planner-layout', useNewLayout ? 'new' : 'old');
  }, [useNewLayout]);

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
        <div className="flex items-center justify-between">
          <PageHeader
            title="Search Ads Planner"
            description="Create and manage search advertising campaigns"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseNewLayout(!useNewLayout)}
            className="gap-sm"
          >
            {useNewLayout ? (
              <>
                <Layout className="h-4 w-4" />
                Classic View
              </>
            ) : (
              <>
                <LayoutGrid className="h-4 w-4" />
                New Layout
              </>
            )}
          </Button>
        </div>
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
        ) : useNewLayout ? (
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
        ) : (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={40} minSize={30}>
              <SearchHierarchyPanel
                onEditAd={handleEditAd}
                onCreateAd={handleCreateAd}
                adType={adType}
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

      <AdQuickActions />
    </div>
  );
}
