import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LpTypesManager } from "./LpTypesManager";
import { UtmPlatformManager } from "./UtmPlatformManager";
import { UtmMediumManager } from "./UtmMediumManager";
import { CampaignLibrary } from "./CampaignLibrary";
import { EntitiesManager } from "./EntitiesManager";

export function UtmConfigurationTab() {
  const [activeTab, setActiveTab] = useState("entities");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">UTM Configuration</h2>
        <p className="text-muted-foreground">
          Manage entities, platforms, mediums, campaigns, and landing page types
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="mediums">Mediums</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="lp-types">LP Types</TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="space-y-4">
          <EntitiesManager />
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <UtmPlatformManager />
        </TabsContent>

        <TabsContent value="mediums" className="space-y-4">
          <UtmMediumManager />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignLibrary />
        </TabsContent>

        <TabsContent value="lp-types" className="space-y-4">
          <LpTypesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
