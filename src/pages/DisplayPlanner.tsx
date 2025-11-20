import { useState } from "react";
import SearchAdEditor from "@/components/search/SearchAdEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SearchHierarchyPanel } from "@/components/search/SearchHierarchyPanel";
import { AdPreviewPanel } from "@/components/search/AdPreviewPanel";
import { ScrollArea } from "@/components/ui/scroll-area";

type ViewState = 'hierarchy' | 'ad-editor';

interface EditorContext {
  ad: any;
  adGroup: any;
  campaign: any;
  entity: string;
}

export default function DisplayPlanner() {
  const [editorContext, setEditorContext] = useState<EditorContext | null>(null);
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

  const handleFieldChange = (fields: any) => {
    setEditorState(fields);
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
        <ResizablePanelGroup direction="horizontal">
          {/* LEFT: Hierarchy (always visible) */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <SearchHierarchyPanel
              onEditAd={handleEditAd}
              onCreateAd={handleCreateAd}
              adType="display"
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* MIDDLE: Editor Form */}
          <ResizablePanel defaultSize={40} minSize={30}>
            {editorContext ? (
              <ScrollArea className="h-full">
                <div className="p-md">
                  <SearchAdEditor
                    ad={editorContext.ad}
                    adGroup={editorContext.adGroup}
                    campaign={editorContext.campaign}
                    entity={editorContext.entity}
                    adType="display"
                    onSave={handleSave}
                    onCancel={handleCancel}
                    showHeader={false}
                    onFieldChange={handleFieldChange}
                  />
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full flex items-center justify-center p-md bg-muted/30">
                <p className="text-body text-muted-foreground">
                  Select an ad to edit or create a new one
                </p>
              </div>
            )}
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* RIGHT: Preview */}
          <ResizablePanel defaultSize={30} minSize={25}>
            {editorContext ? (
              <AdPreviewPanel
                ad={editorContext.ad}
                campaign={editorContext.campaign}
                entity={editorContext.entity}
                adType="display"
                {...editorState}
              />
            ) : (
              <div className="h-full flex items-center justify-center p-md bg-muted/30">
                <p className="text-body text-muted-foreground">
                  Preview will appear here
                </p>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
