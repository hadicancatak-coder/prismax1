import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SearchHierarchyPanel } from "@/components/search/SearchHierarchyPanel";
import SearchAdEditor from "@/components/search/SearchAdEditor";

type ViewState = 'hierarchy' | 'ad-editor';

interface EditorContext {
  ad: any;
  adGroup: any;
  campaign: any;
  entity: string;
}

export default function SearchPlanner() {
  const [view, setView] = useState<ViewState>('hierarchy');
  const [editorContext, setEditorContext] = useState<EditorContext | null>(null);

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Panel: Hierarchy Tree */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <SearchHierarchyPanel
            onEditAd={(ad, adGroup, campaign, entity) => {
              setEditorContext({ ad, adGroup, campaign, entity });
              setView('ad-editor');
            }}
            onCreateAd={(adGroup, campaign, entity) => {
              setEditorContext({ ad: {}, adGroup, campaign, entity });
              setView('ad-editor');
            }}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Ad Editor or Empty State */}
        <ResizablePanel defaultSize={70} minSize={60}>
          {view === 'ad-editor' && editorContext ? (
            <SearchAdEditor
              ad={editorContext.ad}
              adGroup={editorContext.adGroup}
              campaign={editorContext.campaign}
              entity={editorContext.entity}
              onSave={(adId) => {
                setView('hierarchy');
                setEditorContext(null);
              }}
              onCancel={() => {
                setView('hierarchy');
                setEditorContext(null);
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select an ad to edit or create a new one from the left panel
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
