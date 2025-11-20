import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BestPracticeValidator } from "./BestPracticeValidator";
import { DKITemplateEditor } from "./DKITemplateEditor";
import { HeadlineDiversityChecker } from "./HeadlineDiversityChecker";
import { CheckCircle, Code, Shuffle } from "lucide-react";

export function AdToolsTab() {
  const [activeToolTab, setActiveToolTab] = useState("validation");

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs value={activeToolTab} onValueChange={setActiveToolTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
          <TabsTrigger 
            value="validation" 
            className="gap-sm px-md py-sm data-[state=active]:bg-muted data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-smooth"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="text-body-sm font-medium">Validation</span>
          </TabsTrigger>
          <TabsTrigger 
            value="dki" 
            className="gap-sm px-md py-sm data-[state=active]:bg-muted data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-smooth"
          >
            <Code className="h-4 w-4" />
            <span className="text-body-sm font-medium">DKI Templates</span>
          </TabsTrigger>
          <TabsTrigger 
            value="diversity" 
            className="gap-sm px-md py-sm data-[state=active]:bg-muted data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none transition-smooth"
          >
            <Shuffle className="h-4 w-4" />
            <span className="text-body-sm font-medium">Diversity Check</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="validation" className="h-full m-0 p-md">
            <BestPracticeValidator
              headlines={[]}
              descriptions={[]}
              entity=""
            />
          </TabsContent>
          <TabsContent value="dki" className="h-full m-0 p-md">
            <DKITemplateEditor
              headlines={[]}
              onUpdate={() => {}}
            />
          </TabsContent>
          <TabsContent value="diversity" className="h-full m-0 p-md">
            <HeadlineDiversityChecker headlines={[]} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
