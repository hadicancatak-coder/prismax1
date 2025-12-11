import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtmBuilder } from "@/components/utm/UtmBuilder";
import { UtmTableGroupedView } from "@/components/utm/UtmTableGroupedView";
import { UtmInlineFilters } from "@/components/utm/UtmInlineFilters";
import { ReadyLinksBuilder } from "@/components/utm/ReadyLinksBuilder";
import { UtmConfigurationTab } from "@/components/utm/UtmConfigurationTab";
import { UtmAutomationTab } from "@/components/utm/UtmAutomationTab";
import { PageContainer, PageHeader, AlertBanner, DataCard } from "@/components/layout";
import { useUtmLinks, UtmLinkFilters } from "@/hooks/useUtmLinks";
import { Link2, Plus, List, Sparkles, Settings, Zap, ExternalLink } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

const UtmPlanner = () => {
  const [activeTab, setActiveTab] = useState("builder");
  const [filters, setFilters] = useState<UtmLinkFilters>({});
  
  const { data: utmLinks = [], isLoading } = useUtmLinks(filters);

  return (
    <PageContainer>
      <PageHeader
        icon={Link2}
        title="UTM Planner"
        description="Create, manage, and track your UTM campaign links"
      />

      <AlertBanner variant="info" title="UTM Link Verification Required">
        You are responsible for UTM links correctness. Check and ensure links are correct and working. System can make mistakes. You may use this{" "}
        <a
          href="https://docs.google.com/spreadsheets/d/1Desiq_cUDzdypT-Y54EUkKDWDj2ZJyQm0mHLpxhBFJs/edit?gid=1643442957#gid=1643442957"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline hover:no-underline"
        >
          Google Sheets
          <ExternalLink className="h-3 w-3" />
        </a>
        {" "}to generate UTMs in case of an error here.
      </AlertBanner>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-5 w-full lg:w-auto bg-muted/50">
          <TabsTrigger value="builder" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Builder</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Links</span>
          </TabsTrigger>
          <TabsTrigger value="ready" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Ready</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Automation</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" forceMount hidden={activeTab !== "builder"} className="mt-lg">
          <UtmBuilder />
        </TabsContent>

        <TabsContent value="links" forceMount hidden={activeTab !== "links"} className="mt-lg space-y-md">
          <UtmInlineFilters filters={filters} onFiltersChange={setFilters} />
          <DataCard noPadding>
            {isLoading ? (
              <div className="p-md">
                <TableSkeleton columns={5} rows={8} />
              </div>
            ) : (
              <UtmTableGroupedView links={utmLinks} />
            )}
          </DataCard>
        </TabsContent>

        <TabsContent value="ready" forceMount hidden={activeTab !== "ready"} className="mt-lg">
          <ReadyLinksBuilder />
        </TabsContent>

        <TabsContent value="config" forceMount hidden={activeTab !== "config"} className="mt-lg">
          <UtmConfigurationTab />
        </TabsContent>

        <TabsContent value="automation" forceMount hidden={activeTab !== "automation"} className="mt-lg">
          <UtmAutomationTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default UtmPlanner;
