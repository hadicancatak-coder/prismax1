import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtmBuilder } from "@/components/utm/UtmBuilder";
import { UtmTableGroupedView } from "@/components/utm/UtmTableGroupedView";
import { UtmInlineFilters } from "@/components/utm/UtmInlineFilters";
import { CampaignLibrary } from "@/components/utm/CampaignLibrary";
import { useUtmLinks, UtmLinkFilters } from "@/hooks/useUtmLinks";
import { Link2, Plus, List, Folder } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const UtmPlanner = () => {
  const [activeTab, setActiveTab] = useState("builder");
  const [filters, setFilters] = useState<UtmLinkFilters>({});
  const { data: utmLinks = [], isLoading } = useUtmLinks(filters);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link2 className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">UTM Planner</h1>
          <p className="text-muted-foreground">
            Create, manage, and track your UTM campaign links
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3">
          <TabsTrigger value="builder" className="gap-2">
            <Plus className="h-4 w-4" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <Folder className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2">
            <List className="h-4 w-4" />
            Links ({utmLinks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <UtmBuilder onSave={() => setActiveTab("links")} />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignLibrary />
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <UtmInlineFilters filters={filters} onFiltersChange={setFilters} />

          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading UTM links...
              </CardContent>
            </Card>
          ) : (
            <UtmTableGroupedView links={utmLinks} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UtmPlanner;
