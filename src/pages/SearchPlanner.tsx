import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { SearchHierarchyPanel } from "@/components/search/SearchHierarchyPanel";
import SearchAdEditor from "@/components/search/SearchAdEditor";
import { Button } from "@/components/ui/button";
import { Menu, X, Search } from "lucide-react";

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
  const [view, setView] = useState<ViewState>('hierarchy');
  const [editorContext, setEditorContext] = useState<EditorContext | null>(null);
  const [showHierarchy, setShowHierarchy] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-page-title">Search Ads Planner</h1>
            <p className="text-sm text-muted-foreground">Create and manage search advertising campaigns</p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-20 left-4 z-50">
        <Button
          size="icon"
          onClick={() => setShowHierarchy(!showHierarchy)}
          className="shadow-lg"
        >
          {showHierarchy ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay Panel */}
      {showHierarchy && (
        <div className="md:hidden fixed inset-0 bg-background z-40 overflow-auto pt-16">
          <SearchHierarchyPanel
            adType={adType}
            onEditAd={(ad, adGroup, campaign, entity) => {
              setEditorContext({ ad, adGroup, campaign, entity });
              setView('ad-editor');
              setShowHierarchy(false);
            }}
            onCreateAd={(adGroup, campaign, entity) => {
              setEditorContext({ ad: {}, adGroup, campaign, entity });
              setView('ad-editor');
              setShowHierarchy(false);
            }}
          />
        </div>
      )}

      {/* Desktop Layout */}
      <ResizablePanelGroup direction="horizontal" className="hidden md:flex">
        {/* Left Panel: Hierarchy Tree */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <SearchHierarchyPanel
            adType={adType}
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
        <ResizablePanel defaultSize={70} minSize={50}>
          {view === 'ad-editor' && editorContext ? (
            <SearchAdEditor
              ad={editorContext.ad}
              adGroup={editorContext.adGroup}
              campaign={editorContext.campaign}
              entity={editorContext.entity}
              adType={adType}
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

      {/* Mobile Layout */}
      <div className="md:hidden h-full">
        {view === 'ad-editor' && editorContext ? (
          <SearchAdEditor
            ad={editorContext.ad}
            adGroup={editorContext.adGroup}
            campaign={editorContext.campaign}
            entity={editorContext.entity}
            adType={adType}
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
          <div className="h-full flex items-center justify-center text-muted-foreground px-4 text-center">
            Tap the menu button to select an ad or create a new one
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
