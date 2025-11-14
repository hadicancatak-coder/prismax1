import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Target } from "lucide-react";
import SelectorsManagement from "./SelectorsManagement";
import KPIsManagement from "./KPIsManagement";

export default function Config() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-section-title">Configuration</h2>
        <p className="text-muted-foreground mt-1">Manage system selectors and KPIs</p>
      </div>

      <Tabs defaultValue="selectors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="selectors" className="gap-2">
            <Database className="h-4 w-4" />
            Selectors
          </TabsTrigger>
          <TabsTrigger value="kpis" className="gap-2">
            <Target className="h-4 w-4" />
            KPIs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="selectors" className="mt-0">
          <SelectorsManagement />
        </TabsContent>
        
        <TabsContent value="kpis" className="mt-0">
          <KPIsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
