import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtmBuilder } from "@/components/utm/UtmBuilder";
import { UtmTableGroupedView } from "@/components/utm/UtmTableGroupedView";
import { UtmInlineFilters } from "@/components/utm/UtmInlineFilters";
import { CampaignLibrary } from "@/components/utm/CampaignLibrary";
import { ReadyLinksBuilder } from "@/components/utm/ReadyLinksBuilder";
import { UtmConfigurationTab } from "@/components/utm/UtmConfigurationTab";
import { UtmAutomationTab } from "@/components/utm/UtmAutomationTab";
import { useUtmLinks, UtmLinkFilters } from "@/hooks/useUtmLinks";
import { Link2, Plus, List, Folder, Sparkles, Settings, Zap } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

const UtmPlanner = () => {
  const [activeTab, setActiveTab] = useState("builder");
  const [filters, setFilters] = useState<UtmLinkFilters>({});
  
  const { data: utmLinks = [], isLoading } = useUtmLinks(filters);

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-8 space-y-6 lg:space-y-8 bg-background min-h-screen">
      <div className="flex items-center gap-3">
        <Link2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-page-title">UTM Planner</h1>
          <p className="text-muted-foreground mt-1">
            Create, manage, and track your UTM campaign links
          </p>
        </div>
      </div>

      {/* Google Sheets Backup Warning */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-400 mb-1">UTM Link Verification Required</h3>
          <p className="text-sm text-muted-foreground mb-2">
            You are responsibly on UTM links correctness. Check and ensure links are correct and working. System can make mistakes. You may use this{" "}
            <a
              href="https://docs.google.com/spreadsheets/d/1Desiq_cUDzdypT-Y54EUkKDWDj2ZJyQm0mHLpxhBFJs/edit?gid=1643442957#gid=1643442957"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
            >
              Google Sheets
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            {" "}to generate UTMs in case of an error here.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full lg:w-auto">
          <TabsTrigger value="builder" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Builder</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <Folder className="h-4 w-4" />
            <span className="hidden sm:inline">Campaigns</span>
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

        <TabsContent value="builder" forceMount hidden={activeTab !== "builder"} className="space-y-6">
          <UtmBuilder />
        </TabsContent>

        <TabsContent value="campaigns" forceMount hidden={activeTab !== "campaigns"} className="space-y-4">
          <CampaignLibrary />
        </TabsContent>

        <TabsContent value="links" forceMount hidden={activeTab !== "links"} className="space-y-6">
          <UtmInlineFilters filters={filters} onFiltersChange={setFilters} />

          {isLoading ? (
            <TableSkeleton columns={5} rows={8} />
          ) : (
            <UtmTableGroupedView links={utmLinks} />
          )}
        </TabsContent>

        <TabsContent value="ready" forceMount hidden={activeTab !== "ready"} className="space-y-4">
          <ReadyLinksBuilder />
        </TabsContent>

        <TabsContent value="config" forceMount hidden={activeTab !== "config"} className="space-y-6">
          <UtmConfigurationTab />
        </TabsContent>

        <TabsContent value="automation" forceMount hidden={activeTab !== "automation"} className="space-y-6">
          <UtmAutomationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UtmPlanner;
