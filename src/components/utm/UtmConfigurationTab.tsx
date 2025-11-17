import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Megaphone, Folder, FileType } from "lucide-react";
import { LpTypesManager } from "./LpTypesManager";

export function UtmConfigurationTab() {
  const [activeSubTab, setActiveSubTab] = useState("platforms");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuration</h2>
        <p className="text-muted-foreground">
          Manage UTM platforms, mediums, campaigns, and landing page types
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="platforms" className="gap-2">
            <Database className="h-4 w-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="mediums" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Mediums
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <Folder className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="lp-types" className="gap-2">
            <FileType className="h-4 w-4" />
            LP Types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-4">
          <div className="text-muted-foreground">
            Platform management moved here from Admin. Component integration pending.
          </div>
        </TabsContent>

        <TabsContent value="mediums" className="space-y-4">
          <div className="text-muted-foreground">
            Medium management moved here from Admin. Component integration pending.
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="text-muted-foreground">
            Campaign management moved here from Admin. Component integration pending.
          </div>
        </TabsContent>

        <TabsContent value="lp-types" className="space-y-4">
          <LpTypesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
