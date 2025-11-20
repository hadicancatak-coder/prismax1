import { useState, ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LayoutGrid, Edit, Wrench, Library, Table2 } from "lucide-react";

interface AdPlannerLayoutProps {
  structureTab: ReactNode;
  editorTab: ReactNode;
  toolsTab: ReactNode;
  libraryTab: ReactNode;
  batchTab: ReactNode;
  previewPanel?: ReactNode;
}

export function AdPlannerLayout({
  structureTab,
  editorTab,
  toolsTab,
  libraryTab,
  batchTab,
  previewPanel,
}: AdPlannerLayoutProps) {
  const [activeTab, setActiveTab] = useState("structure");

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Desktop: Top horizontal tabs */}
        <TabsList className="hidden md:flex w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
          <TabsTrigger 
            value="structure" 
            className="gap-sm px-md py-sm data-[state=active]:bg-muted data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-smooth"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="text-body-sm font-medium">Structure</span>
          </TabsTrigger>
          <TabsTrigger 
            value="editor" 
            className="gap-sm px-md py-sm data-[state=active]:bg-muted data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-smooth"
          >
            <Edit className="h-4 w-4" />
            <span className="text-body-sm font-medium">Editor</span>
          </TabsTrigger>
          <TabsTrigger 
            value="tools" 
            className="gap-sm px-md py-sm data-[state=active]:bg-muted data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-smooth"
          >
            <Wrench className="h-4 w-4" />
            <span className="text-body-sm font-medium">Tools</span>
          </TabsTrigger>
          <TabsTrigger 
            value="library" 
            className="gap-sm px-md py-sm data-[state=active]:bg-muted data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-smooth"
          >
            <Library className="h-4 w-4" />
            <span className="text-body-sm font-medium">Library</span>
          </TabsTrigger>
          <TabsTrigger 
            value="batch" 
            className="gap-sm px-md py-sm data-[state=active]:bg-muted data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-smooth"
          >
            <Table2 className="h-4 w-4" />
            <span className="text-body-sm font-medium">Batch</span>
          </TabsTrigger>
        </TabsList>

        {/* Mobile: Bottom fixed tabs */}
        <TabsList className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around bg-card border-t border-border rounded-none h-16 p-0">
          <TabsTrigger 
            value="structure" 
            className="flex-1 flex-col gap-xs py-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-smooth"
          >
            <LayoutGrid className="h-5 w-5" />
            <span className="text-metadata">Structure</span>
          </TabsTrigger>
          <TabsTrigger 
            value="editor" 
            className="flex-1 flex-col gap-xs py-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-smooth"
          >
            <Edit className="h-5 w-5" />
            <span className="text-metadata">Editor</span>
          </TabsTrigger>
          <TabsTrigger 
            value="tools" 
            className="flex-1 flex-col gap-xs py-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-smooth"
          >
            <Wrench className="h-5 w-5" />
            <span className="text-metadata">Tools</span>
          </TabsTrigger>
          <TabsTrigger 
            value="library" 
            className="flex-1 flex-col gap-xs py-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-smooth"
          >
            <Library className="h-5 w-5" />
            <span className="text-metadata">Library</span>
          </TabsTrigger>
          <TabsTrigger 
            value="batch" 
            className="flex-1 flex-col gap-xs py-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-smooth"
          >
            <Table2 className="h-5 w-5" />
            <span className="text-metadata">Batch</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <TabsContent value="structure" className="h-full m-0 p-0">
              {structureTab}
            </TabsContent>
            <TabsContent value="editor" className="h-full m-0 p-0">
              {editorTab}
            </TabsContent>
            <TabsContent value="tools" className="h-full m-0 p-0">
              {toolsTab}
            </TabsContent>
            <TabsContent value="library" className="h-full m-0 p-0">
              {libraryTab}
            </TabsContent>
            <TabsContent value="batch" className="h-full m-0 p-0">
              {batchTab}
            </TabsContent>
          </div>

          {/* Desktop: Right preview panel */}
          {previewPanel && (
            <div className="hidden lg:block w-96 border-l border-border">
              {previewPanel}
            </div>
          )}
        </div>
      </Tabs>

      {/* Mobile bottom spacing for fixed tabs */}
      <div className="md:hidden h-16" />
    </div>
  );
}
