import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { AccountStructureTree } from "@/components/ads/AccountStructureTree";
import { SearchBuilderArea } from "@/components/search/SearchBuilderArea";

export default function SearchPlanner() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <AccountStructureTree
            selectedNodeId={undefined}
            onSelectNode={() => {}}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={70} minSize={30}>
          <SearchBuilderArea />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
